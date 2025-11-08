const express = require('express');
const PDFDocument = require('pdfkit');
const { pool } = require('../config/database');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Generate payroll (Payroll Officer/Admin)
router.post('/generate', verifyToken, authorizeRoles('admin', 'payroll'), async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Please provide month and year'
      });
    }

    if (month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month. Month must be between 1 and 12'
      });
    }

    // Get all active employees
    const employeesResult = await pool.query(
      'SELECT id, name, base_salary FROM users WHERE role = $1 AND status = $2',
      ['employee', 'active']
    );

    const employees = employeesResult.rows;
    const payrollResults = [];

    for (const employee of employees) {
      // Check if payroll already exists
      const existingPayroll = await pool.query(
        'SELECT id FROM payroll WHERE user_id = $1 AND month = $2 AND year = $3',
        [employee.id, month, year]
      );

      if (existingPayroll.rows.length > 0) {
        // Skip if already generated
        continue;
      }

      // Calculate days in month
      const daysInMonth = new Date(year, month, 0).getDate();
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-${daysInMonth}`;

      // Get attendance data
      const attendanceResult = await pool.query(
        `SELECT 
          COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
          COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_days,
          COUNT(CASE WHEN status = 'leave' THEN 1 END) as leave_days
        FROM attendance
        WHERE user_id = $1 AND date >= $2 AND date <= $3`,
        [employee.id, startDate, endDate]
      );

      const attendance = attendanceResult.rows[0];
      const presentDays = parseInt(attendance.present_days) || 0;
      const absentDays = parseInt(attendance.absent_days) || 0;
      const leaveDays = parseInt(attendance.leave_days) || 0;

      // Get approved leaves (paid and unpaid)
      const leavesResult = await pool.query(
        `SELECT 
          COUNT(CASE WHEN paid_status = 'paid' THEN 1 END) as paid_leaves,
          COUNT(CASE WHEN paid_status = 'unpaid' THEN 1 END) as unpaid_leaves
        FROM leaves
        WHERE user_id = $1 
          AND status = 'approved'
          AND ((from_date >= $2 AND from_date <= $3) OR (to_date >= $2 AND to_date <= $3))`,
        [employee.id, startDate, endDate]
      );

      const leaves = leavesResult.rows[0];
      const paidLeaves = parseInt(leaves.paid_leaves) || 0;
      const unpaidLeaves = parseInt(leaves.unpaid_leaves) || 0;

      // Calculate salary
      const basicSalary = parseFloat(employee.base_salary) || 0;
      const dailySalary = basicSalary / 30;
      const unpaidLeaveDeduction = unpaidLeaves * dailySalary;
      const pfDeduction = basicSalary * 0.12; // 12% PF
      const professionalTax = 200; // Fixed professional tax

      const netSalary = basicSalary - unpaidLeaveDeduction - pfDeduction - professionalTax;

      // Insert payroll
      const payrollResult = await pool.query(
        `INSERT INTO payroll (
          user_id, month, year, basic_salary, paid_leaves, unpaid_leaves,
          pf_deduction, professional_tax, net_salary, generated_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, user_id, month, year, basic_salary, paid_leaves, unpaid_leaves,
          pf_deduction, professional_tax, net_salary, created_at`,
        [
          employee.id, month, year, basicSalary, paidLeaves, unpaidLeaves,
          pfDeduction, professionalTax, netSalary, req.user.id
        ]
      );

      payrollResults.push(payrollResult.rows[0]);
    }

    res.status(201).json({
      success: true,
      message: `Payroll generated successfully for ${month}/${year}`,
      count: payrollResults.length,
      payroll: payrollResults
    });
  } catch (error) {
    console.error('Generate payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating payroll',
      error: error.message
    });
  }
});

// Download payslip PDF (must come before /:user_id route)
router.get('/payslip/:id/pdf', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get payslip data
    const payslipResult = await pool.query(
      `SELECT 
        p.id, p.user_id, p.month, p.year, p.basic_salary, p.paid_leaves,
        p.unpaid_leaves, p.pf_deduction, p.professional_tax, p.net_salary,
        u.name as employee_name, u.email as employee_email, u.department
      FROM payroll p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1`,
      [id]
    );

    if (payslipResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payslip not found'
      });
    }

    const payslip = payslipResult.rows[0];

    // Employees can only download their own payslips
    if (req.user.role === 'employee' && payslip.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only download your own payslips.'
      });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    const monthName = new Date(2000, payslip.month - 1).toLocaleString('default', { month: 'long' });
    res.setHeader('Content-Disposition', `attachment; filename=payslip_${monthName}_${payslip.year}.pdf`);

    doc.pipe(res);

    // Header
    doc.fontSize(24).text('WorkZen HRMS', { align: 'center' });
    doc.fontSize(18).text('Salary Payslip', { align: 'center' });
    doc.moveDown(2);

    // Employee Info
    doc.fontSize(14).text('Employee Information', { underline: true });
    doc.fontSize(12);
    doc.text(`Name: ${payslip.employee_name}`);
    doc.text(`Email: ${payslip.employee_email}`);
    doc.text(`Department: ${payslip.department || 'N/A'}`);
    doc.moveDown();

    // Pay Period
    doc.fontSize(14).text('Pay Period', { underline: true });
    doc.fontSize(12);
    doc.text(`Month: ${monthName} ${payslip.year}`);
    doc.moveDown();

    // Salary Details
    doc.fontSize(14).text('Salary Details', { underline: true });
    doc.fontSize(12);
    
    const startX = 50;
    const startY = doc.y;
    let currentY = startY;

    doc.text('Basic Salary:', startX, currentY);
    doc.text(`₹${payslip.basic_salary}`, 300, currentY, { align: 'right' });
    currentY += 20;

    doc.text('Paid Leaves:', startX, currentY);
    doc.text(`${payslip.paid_leaves} days`, 300, currentY, { align: 'right' });
    currentY += 20;

    doc.text('Unpaid Leaves:', startX, currentY);
    doc.text(`${payslip.unpaid_leaves} days`, 300, currentY, { align: 'right' });
    currentY += 20;

    doc.text('PF Deduction (12%):', startX, currentY);
    doc.text(`-₹${payslip.pf_deduction}`, 300, currentY, { align: 'right' });
    currentY += 20;

    doc.text('Professional Tax:', startX, currentY);
    doc.text(`-₹${payslip.professional_tax}`, 300, currentY, { align: 'right' });
    currentY += 30;

    // Net Salary
    doc.fontSize(16).text('Net Salary:', startX, currentY);
    doc.fontSize(16).text(`₹${payslip.net_salary}`, 300, currentY, { align: 'right' });

    // Footer
    doc.moveDown(3);
    doc.fontSize(10).text('This is a system generated payslip.', { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Download payslip PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating payslip PDF',
      error: error.message
    });
  }
});

// Get all payroll reports (Payroll/Admin) - must come before /:user_id route
router.get('/reports/all', verifyToken, authorizeRoles('admin', 'payroll'), async (req, res) => {
  try {
    const { month, year, search } = req.query;

    let query = `
      SELECT 
        p.id, p.user_id, p.month, p.year, p.basic_salary, p.paid_leaves,
        p.unpaid_leaves, p.pf_deduction, p.professional_tax, p.net_salary,
        p.created_at,
        u.name as employee_name, u.email as employee_email, u.department
      FROM payroll p
      JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (month) {
      query += ` AND p.month = $${paramCount++}`;
      params.push(month);
    }

    if (year) {
      query += ` AND p.year = $${paramCount++}`;
      params.push(year);
    }

    if (search) {
      query += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ' ORDER BY p.year DESC, p.month DESC, u.name';

    const result = await pool.query(query, params);

    // Calculate totals
    const totals = result.rows.reduce((acc, row) => {
      acc.totalBasicSalary += parseFloat(row.basic_salary) || 0;
      acc.totalNetSalary += parseFloat(row.net_salary) || 0;
      acc.totalDeductions += parseFloat(row.pf_deduction) + parseFloat(row.professional_tax) || 0;
      return acc;
    }, {
      totalBasicSalary: 0,
      totalNetSalary: 0,
      totalDeductions: 0
    });

    res.json({
      success: true,
      payroll: result.rows,
      totals
    });
  } catch (error) {
    console.error('Get payroll reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payroll reports',
      error: error.message
    });
  }
});

// Get payroll summary for dashboard - must come before /:user_id route
router.get('/summary/dashboard', verifyToken, authorizeRoles('admin', 'payroll'), async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Get current month payroll summary
    const currentMonthResult = await pool.query(
      `SELECT 
        COUNT(*) as employee_count,
        SUM(basic_salary) as total_basic_salary,
        SUM(net_salary) as total_net_salary,
        SUM(pf_deduction) as total_pf,
        SUM(professional_tax) as total_tax
      FROM payroll
      WHERE month = $1 AND year = $2`,
      [currentMonth, currentYear]
    );

    // Get yearly payroll summary
    const yearlyResult = await pool.query(
      `SELECT 
        month,
        SUM(basic_salary) as total_basic_salary,
        SUM(net_salary) as total_net_salary,
        COUNT(*) as employee_count
      FROM payroll
      WHERE year = $1
      GROUP BY month
      ORDER BY month`,
      [currentYear]
    );

    // Get department-wise summary
    const departmentResult = await pool.query(
      `SELECT 
        u.department,
        COUNT(DISTINCT p.user_id) as employee_count,
        SUM(p.net_salary) as total_salary
      FROM payroll p
      JOIN users u ON p.user_id = u.id
      WHERE p.month = $1 AND p.year = $2
      GROUP BY u.department
      ORDER BY u.department`,
      [currentMonth, currentYear]
    );

    res.json({
      success: true,
      currentMonth: currentMonthResult.rows[0] || {
        employee_count: 0,
        total_basic_salary: 0,
        total_net_salary: 0,
        total_pf: 0,
        total_tax: 0
      },
      yearly: yearlyResult.rows,
      departmentWise: departmentResult.rows
    });
  } catch (error) {
    console.error('Get payroll summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payroll summary',
      error: error.message
    });
  }
});

// Get payroll for user (Employee: own, Payroll/Admin: any) - must be last
router.get('/:user_id?', verifyToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    const { month, year } = req.query;
    let targetUserId = user_id ? parseInt(user_id) : req.user.id;

    // Employees can only view their own payroll
    if (req.user.role === 'employee' && targetUserId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own payroll.'
      });
    }

    let query = `
      SELECT 
        p.id, p.user_id, p.month, p.year, p.basic_salary, p.paid_leaves,
        p.unpaid_leaves, p.pf_deduction, p.professional_tax, p.net_salary,
        p.created_at, p.generated_by,
        u.name as employee_name, u.email as employee_email, u.department
      FROM payroll p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = $1
    `;
    const params = [targetUserId];
    let paramCount = 2;

    if (month) {
      query += ` AND p.month = $${paramCount++}`;
      params.push(month);
    }

    if (year) {
      query += ` AND p.year = $${paramCount++}`;
      params.push(year);
    }

    query += ' ORDER BY p.year DESC, p.month DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      payroll: result.rows
    });
  } catch (error) {
    console.error('Get payroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payroll',
      error: error.message
    });
  }
});

module.exports = router;

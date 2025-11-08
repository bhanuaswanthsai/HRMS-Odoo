const express = require('express');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { pool } = require('../config/database');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Search employee reports (Admin & Payroll)
router.get('/search', verifyToken, authorizeRoles('admin', 'payroll'), async (req, res) => {
  try {
    const { name, employee_id } = req.query;

    if (!name && !employee_id) {
      return res.status(400).json({
        success: false,
        message: 'Please provide employee name or ID'
      });
    }

    let query = `
      SELECT 
        u.id, u.name, u.email, u.role, u.department, u.base_salary,
        hr.name as hr_assigned_name, hr.email as hr_assigned_email
      FROM users u
      LEFT JOIN users hr ON u.hr_assigned_id = hr.id
      WHERE u.role = 'employee' AND u.status = 'active'
    `;
    const params = [];
    let paramCount = 1;

    if (employee_id) {
      query += ` AND u.id = $${paramCount++}`;
      params.push(employee_id);
    } else if (name) {
      query += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${name}%`);
    }

    const userResult = await pool.query(query, params);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const employee = userResult.rows[0];

    // Get payroll data
    const payrollResult = await pool.query(
      `SELECT 
        month, year, basic_salary, paid_leaves, unpaid_leaves,
        pf_deduction, professional_tax, net_salary, created_at
      FROM payroll
      WHERE user_id = $1
      ORDER BY year DESC, month DESC
      LIMIT 12`,
      [employee.id]
    );

    // Calculate yearly totals
    const currentYear = new Date().getFullYear();
    const yearlyPayroll = await pool.query(
      `SELECT 
        SUM(basic_salary) as total_salary,
        SUM(net_salary) as total_net_salary,
        SUM(pf_deduction) as total_pf,
        SUM(professional_tax) as total_tax,
        SUM(unpaid_leaves) as total_unpaid_days
      FROM payroll
      WHERE user_id = $1 AND year = $2`,
      [employee.id, currentYear]
    );

    // Get leave statistics
    const leaveStats = await pool.query(
      `SELECT 
        COUNT(CASE WHEN paid_status = 'paid' THEN 1 END) as paid_leaves_count,
        COUNT(CASE WHEN paid_status = 'unpaid' THEN 1 END) as unpaid_leaves_count,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_leaves,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_leaves,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_leaves
      FROM leaves
      WHERE user_id = $1`,
      [employee.id]
    );

    // Get attendance summary
    const attendanceStats = await pool.query(
      `SELECT 
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_days,
        COUNT(CASE WHEN status = 'leave' THEN 1 END) as leave_days,
        COUNT(*) as total_days
      FROM attendance
      WHERE user_id = $1 AND EXTRACT(YEAR FROM date) = $2`,
      [employee.id, currentYear]
    );

    res.json({
      success: true,
      employee: {
        ...employee,
        payroll: payrollResult.rows,
        yearlySummary: yearlyPayroll.rows[0] || {
          total_salary: 0,
          total_net_salary: 0,
          total_pf: 0,
          total_tax: 0,
          total_unpaid_days: 0
        },
        leaveStats: leaveStats.rows[0] || {
          paid_leaves_count: 0,
          unpaid_leaves_count: 0,
          approved_leaves: 0,
          rejected_leaves: 0,
          pending_leaves: 0
        },
        attendanceStats: attendanceStats.rows[0] || {
          present_days: 0,
          absent_days: 0,
          leave_days: 0,
          total_days: 0
        }
      }
    });
  } catch (error) {
    console.error('Search reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching reports',
      error: error.message
    });
  }
});

// Download PDF report
router.get('/download/:employee_id/pdf', verifyToken, authorizeRoles('admin', 'payroll'), async (req, res) => {
  try {
    const { employee_id } = req.params;

    // Get employee data
    const employeeResult = await pool.query(
      `SELECT 
        u.id, u.name, u.email, u.role, u.department, u.base_salary,
        hr.name as hr_assigned_name
      FROM users u
      LEFT JOIN users hr ON u.hr_assigned_id = hr.id
      WHERE u.id = $1`,
      [employee_id]
    );

    if (employeeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const employee = employeeResult.rows[0];
    const currentYear = new Date().getFullYear();

    // Get yearly data
    const yearlyPayroll = await pool.query(
      `SELECT 
        SUM(basic_salary) as total_salary,
        SUM(net_salary) as total_net_salary,
        SUM(pf_deduction) as total_pf,
        SUM(professional_tax) as total_tax,
        SUM(unpaid_leaves) as total_unpaid_days
      FROM payroll
      WHERE user_id = $1 AND year = $2`,
      [employee_id, currentYear]
    );

    const leaveStats = await pool.query(
      `SELECT 
        COUNT(CASE WHEN paid_status = 'paid' THEN 1 END) as paid_leaves,
        COUNT(CASE WHEN paid_status = 'unpaid' THEN 1 END) as unpaid_leaves
      FROM leaves
      WHERE user_id = $1 AND status = 'approved'`,
      [employee_id]
    );

    const attendanceStats = await pool.query(
      `SELECT 
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_days
      FROM attendance
      WHERE user_id = $1 AND EXTRACT(YEAR FROM date) = $2`,
      [employee_id, currentYear]
    );

    // Create PDF
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report_${employee_id}_${currentYear}.pdf`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('WorkZen HRMS - Employee Report', { align: 'center' });
    doc.moveDown();

    // Employee Info
    doc.fontSize(16).text('Employee Information', { underline: true });
    doc.fontSize(12);
    doc.text(`Name: ${employee.name}`);
    doc.text(`Email: ${employee.email}`);
    doc.text(`Department: ${employee.department || 'N/A'}`);
    doc.text(`Base Salary: ₹${employee.base_salary}`);
    doc.text(`HR Assigned: ${employee.hr_assigned_name || 'N/A'}`);
    doc.moveDown();

    // Yearly Summary
    const yearly = yearlyPayroll.rows[0] || {};
    doc.fontSize(16).text(`Yearly Summary (${currentYear})`, { underline: true });
    doc.fontSize(12);
    doc.text(`Total Salary: ₹${yearly.total_salary || 0}`);
    doc.text(`Net Salary: ₹${yearly.total_net_salary || 0}`);
    doc.text(`PF Deduction: ₹${yearly.total_pf || 0}`);
    doc.text(`Professional Tax: ₹${yearly.total_tax || 0}`);
    doc.text(`Unpaid Leave Days: ${yearly.total_unpaid_days || 0}`);
    doc.moveDown();

    // Leave Statistics
    const leaves = leaveStats.rows[0] || {};
    doc.fontSize(16).text('Leave Statistics', { underline: true });
    doc.fontSize(12);
    doc.text(`Paid Leaves: ${leaves.paid_leaves || 0}`);
    doc.text(`Unpaid Leaves: ${leaves.unpaid_leaves || 0}`);
    doc.moveDown();

    // Attendance Statistics
    const attendance = attendanceStats.rows[0] || {};
    doc.fontSize(16).text('Attendance Statistics', { underline: true });
    doc.fontSize(12);
    doc.text(`Present Days: ${attendance.present_days || 0}`);
    doc.text(`Absent Days: ${attendance.absent_days || 0}`);

    doc.end();
  } catch (error) {
    console.error('Download PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating PDF',
      error: error.message
    });
  }
});

// Download Excel report
router.get('/download/:employee_id/excel', verifyToken, authorizeRoles('admin', 'payroll'), async (req, res) => {
  try {
    const { employee_id } = req.params;

    // Get employee data
    const employeeResult = await pool.query(
      `SELECT 
        u.id, u.name, u.email, u.role, u.department, u.base_salary,
        hr.name as hr_assigned_name
      FROM users u
      LEFT JOIN users hr ON u.hr_assigned_id = hr.id
      WHERE u.id = $1`,
      [employee_id]
    );

    if (employeeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const employee = employeeResult.rows[0];
    const currentYear = new Date().getFullYear();

    // Get payroll data
    const payrollResult = await pool.query(
      `SELECT month, year, basic_salary, paid_leaves, unpaid_leaves,
       pf_deduction, professional_tax, net_salary
      FROM payroll
      WHERE user_id = $1 AND year = $2
      ORDER BY month`,
      [employee_id, currentYear]
    );

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Employee Report');

    // Employee Info
    worksheet.addRow(['Employee Information']);
    worksheet.addRow(['Name', employee.name]);
    worksheet.addRow(['Email', employee.email]);
    worksheet.addRow(['Department', employee.department || 'N/A']);
    worksheet.addRow(['Base Salary', employee.base_salary]);
    worksheet.addRow(['HR Assigned', employee.hr_assigned_name || 'N/A']);
    worksheet.addRow([]);

    // Payroll Data
    worksheet.addRow(['Payroll Data']);
    worksheet.addRow(['Month', 'Year', 'Basic Salary', 'Paid Leaves', 'Unpaid Leaves', 'PF Deduction', 'Professional Tax', 'Net Salary']);

    payrollResult.rows.forEach(row => {
      worksheet.addRow([
        row.month,
        row.year,
        row.basic_salary,
        row.paid_leaves,
        row.unpaid_leaves,
        row.pf_deduction,
        row.professional_tax,
        row.net_salary
      ]);
    });

    // Set headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=report_${employee_id}_${currentYear}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Download Excel error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating Excel',
      error: error.message
    });
  }
});

module.exports = router;


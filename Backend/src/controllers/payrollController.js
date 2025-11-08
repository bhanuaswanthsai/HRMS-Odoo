import { PayrollModel, PayslipModel } from '../models/Payroll.js';
import { AttendanceModel } from '../models/Attendance.js';
import { LeaveModel } from '../models/Leave.js';
import { EmployeeModel } from '../models/Employee.js';
import { calculatePayroll } from '../utils/payrollCalculator.js';
import { validationResult } from 'express-validator';
import { notifyPayslipGenerated } from './notificationController.js';

export const processPayroll = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { employee_id, month, year } = req.params;

    const employee = await EmployeeModel.findById(employee_id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Get attendance for the month
    const attendanceRecords = await AttendanceModel.getEmployeeLogs(employee_id, {
      start_date: `${year}-${String(month).padStart(2, '0')}-01`,
      end_date: `${year}-${String(month).padStart(2, '0')}-31`,
    });

    // Calculate days
    const totalDays = new Date(year, month, 0).getDate();
    const presentDays = attendanceRecords.filter(a => a.status === 'present').length;
    const absentDays = attendanceRecords.filter(a => a.status === 'absent').length;
    const leaveDays = attendanceRecords.filter(a => a.status === 'leave').length;

    // Get unpaid leaves
    const unpaidLeaves = await LeaveModel.getEmployeeLeaves(employee_id, {
      status: 'approved',
    });
    const unpaidLeaveDays = unpaidLeaves
      .filter(l => {
        const leaveStart = new Date(l.start_date);
        const leaveEnd = new Date(l.end_date);
        return leaveStart.getMonth() + 1 === parseInt(month) && 
               leaveStart.getFullYear() === parseInt(year);
      })
      .reduce((sum, l) => {
        const days = Math.ceil((new Date(l.end_date) - new Date(l.start_date)) / (1000 * 60 * 60 * 24)) + 1;
        return sum + days;
      }, 0);

    // Calculate payroll
    const salaryStructure = employee.salary_structure || {};
    const payrollData = calculatePayroll(
      salaryStructure,
      presentDays,
      totalDays,
      unpaidLeaveDays
    );

    // Save payroll
    const payroll = await PayrollModel.processPayroll({
      employee_id,
      month: parseInt(month),
      year: parseInt(year),
      ...payrollData,
    });

    // Send notification
    await notifyPayslipGenerated(employee_id, month, year);

    res.json({
      success: true,
      message: 'Payroll processed successfully',
      data: payroll,
    });
  } catch (error) {
    console.error('Process payroll error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getEmployeePayroll = async (req, res) => {
  try {
    const { id, month, year } = req.params;
    const payroll = await PayrollModel.findByEmployeeAndPeriod(id, parseInt(month), parseInt(year));

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll not found' });
    }

    res.json({ success: true, data: payroll });
  } catch (error) {
    console.error('Get payroll error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getPayslip = async (req, res) => {
  try {
    const { id } = req.params;
    const payslip = await PayslipModel.findById(id);

    if (!payslip) {
      return res.status(404).json({ success: false, message: 'Payslip not found' });
    }

    res.json({ success: true, data: payslip });
  } catch (error) {
    console.error('Get payslip error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updatePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const payroll = await PayrollModel.update(id, updateData);

    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll not found' });
    }

    res.json({
      success: true,
      message: 'Payroll updated successfully',
      data: payroll,
    });
  } catch (error) {
    console.error('Update payroll error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getPayrollReport = async (req, res) => {
  try {
    const { month, year } = req.params;
    const report = await PayrollModel.getMonthlyReport(parseInt(month), parseInt(year));
    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


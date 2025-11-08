import { AttendanceModel } from '../models/Attendance.js';
import { EmployeeModel } from '../models/Employee.js';
import { validationResult } from 'express-validator';

export const markAttendance = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { employee_id, date, check_in, check_out, status } = req.body;
    const userId = req.user.id;

    // Get employee by user_id if employee_id not provided
    let empId = employee_id;
    if (!empId) {
      const employee = await EmployeeModel.findByUserId(userId);
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee record not found' });
      }
      empId = employee.id;
    }

    const attendance = await AttendanceModel.markAttendance({
      employee_id: empId,
      date: date || new Date().toISOString().split('T')[0],
      check_in,
      check_out,
      status,
    });

    res.json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance,
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getMyLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const employee = await EmployeeModel.findByUserId(userId);

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee record not found' });
    }

    const { start_date, end_date, limit } = req.query;
    const logs = await AttendanceModel.getEmployeeLogs(employee.id, {
      start_date,
      end_date,
      limit: limit ? parseInt(limit) : undefined,
    });

    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getEmployeeAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;

    const logs = await AttendanceModel.getEmployeeLogs(id, { start_date, end_date });
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Get employee attendance error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getAttendanceReport = async (req, res) => {
  try {
    const { month, year } = req.params;
    const report = await AttendanceModel.getMonthlyReport(parseInt(month), parseInt(year));
    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


import { LeaveModel, LeaveBalanceModel } from '../models/Leave.js';
import { EmployeeModel } from '../models/Employee.js';
import { validationResult } from 'express-validator';
import { notifyLeaveApproval, notifyLeaveRejection } from './notificationController.js';

export const applyLeave = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { leave_type, start_date, end_date, reason } = req.body;
    const userId = req.user.id;

    const employee = await EmployeeModel.findByUserId(userId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee record not found' });
    }

    // Check leave balance
    let balance = await LeaveBalanceModel.getBalance(employee.id);
    if (!balance) {
      balance = await LeaveBalanceModel.initialize(employee.id);
    }

    const leaveTypeMap = {
      casual_leave: balance.casual_leave,
      sick_leave: balance.sick_leave,
      earned_leave: balance.earned_leave,
      paid_leave: balance.paid_leave,
    };

    const days = Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24)) + 1;
    const availableDays = leaveTypeMap[leave_type] || 0;

    if (days > availableDays) {
      return res.status(400).json({
        success: false,
        message: `Insufficient leave balance. Available: ${availableDays} days`,
      });
    }

    const leave = await LeaveModel.create({
      employee_id: employee.id,
      leave_type,
      start_date,
      end_date,
      reason,
    });

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: leave,
    });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getMyLeaves = async (req, res) => {
  try {
    const userId = req.user.id;
    const employee = await EmployeeModel.findByUserId(userId);

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee record not found' });
    }

    const { status } = req.query;
    const leaves = await LeaveModel.getEmployeeLeaves(employee.id, { status });
    res.json({ success: true, data: leaves });
  } catch (error) {
    console.error('Get leaves error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getPendingLeaves = async (req, res) => {
  try {
    const leaves = await LeaveModel.getPendingLeaves();
    res.json({ success: true, data: leaves });
  } catch (error) {
    console.error('Get pending leaves error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const approveLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const approvedBy = req.user.id;

    const leave = await LeaveModel.findById(id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Leave is not pending' });
    }

    // Calculate days
    const days = Math.ceil((new Date(leave.end_date) - new Date(leave.start_date)) / (1000 * 60 * 60 * 24)) + 1;

    // Update leave balance
    await LeaveBalanceModel.updateBalance(leave.employee_id, leave.leave_type, days);

    // Approve leave
    const updatedLeave = await LeaveModel.approve(id, approvedBy);

    // Send notification
    await notifyLeaveApproval(leave.employee_id, leave.start_date, leave.end_date);

    res.json({
      success: true,
      message: 'Leave approved successfully',
      data: updatedLeave,
    });
  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const rejectLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const approvedBy = req.user.id;

    const leave = await LeaveModel.findById(id);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave not found' });
    }

    const updatedLeave = await LeaveModel.reject(id, approvedBy);

    // Send notification
    await notifyLeaveRejection(leave.employee_id, leave.start_date, leave.end_date, req.body.reason);

    res.json({
      success: true,
      message: 'Leave rejected',
      data: updatedLeave,
    });
  } catch (error) {
    console.error('Reject leave error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getLeaveBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    const employee = await EmployeeModel.findByUserId(userId);

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee record not found' });
    }

    let balance = await LeaveBalanceModel.getBalance(employee.id);
    if (!balance) {
      balance = await LeaveBalanceModel.initialize(employee.id);
    }

    res.json({ success: true, data: balance });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


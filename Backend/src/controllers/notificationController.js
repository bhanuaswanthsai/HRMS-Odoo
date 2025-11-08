import { NotificationModel } from '../models/Settings.js';
import { UserModel } from '../models/User.js';
import { EmployeeModel } from '../models/Employee.js';
import { sendLeaveApprovalEmail, sendLeaveRejectionEmail, sendPayslipEmail, sendAttendanceReminder } from '../utils/emailService.js';

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { read, limit } = req.query;

    const notifications = await NotificationModel.getUserNotifications(userId, {
      read: read === 'true' ? true : read === 'false' ? false : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await NotificationModel.markAsRead(id, userId);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await NotificationModel.markAllAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: notifications,
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Helper function to create and send notification
export const createNotification = async (userId, type, title, message) => {
  try {
    const notification = await NotificationModel.create({
      user_id: userId,
      type,
      title,
      message,
    });
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};

// Helper function to send leave approval notification
export const notifyLeaveApproval = async (employeeId, startDate, endDate) => {
  try {
    const employee = await EmployeeModel.findById(employeeId);
    if (!employee) return;

    const user = await UserModel.findById(employee.user_id);
    if (!user || !user.email) return;

    // Create in-app notification
    await createNotification(
      user.id,
      'leave_approved',
      'Leave Approved',
      `Your leave from ${startDate} to ${endDate} has been approved.`
    );

    // Send email
    await sendLeaveApprovalEmail(
      user.email,
      user.profile_data?.name || 'Employee',
      startDate,
      endDate
    );
  } catch (error) {
    console.error('Notify leave approval error:', error);
  }
};

// Helper function to send leave rejection notification
export const notifyLeaveRejection = async (employeeId, startDate, endDate, reason) => {
  try {
    const employee = await EmployeeModel.findById(employeeId);
    if (!employee) return;

    const user = await UserModel.findById(employee.user_id);
    if (!user || !user.email) return;

    await createNotification(
      user.id,
      'leave_rejected',
      'Leave Rejected',
      `Your leave from ${startDate} to ${endDate} has been rejected.${reason ? ` Reason: ${reason}` : ''}`
    );

    await sendLeaveRejectionEmail(
      user.email,
      user.profile_data?.name || 'Employee',
      startDate,
      endDate,
      reason
    );
  } catch (error) {
    console.error('Notify leave rejection error:', error);
  }
};

// Helper function to send payslip notification
export const notifyPayslipGenerated = async (employeeId, month, year) => {
  try {
    const employee = await EmployeeModel.findById(employeeId);
    if (!employee) return;

    const user = await UserModel.findById(employee.user_id);
    if (!user || !user.email) return;

    await createNotification(
      user.id,
      'payslip_generated',
      'Payslip Generated',
      `Your payslip for ${month}/${year} has been generated.`
    );

    await sendPayslipEmail(
      user.email,
      user.profile_data?.name || 'Employee',
      month,
      year
    );
  } catch (error) {
    console.error('Notify payslip error:', error);
  }
};


import nodemailer from 'nodemailer';
import { EmailTemplateModel } from '../models/Settings.js';

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Replace template variables
const replaceVariables = (template, variables) => {
  let result = template;
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, variables[key] || '');
  });
  return result;
};

// Send email using template
export const sendEmailWithTemplate = async (to, templateName, variables = {}) => {
  try {
    const template = await EmailTemplateModel.getByName(templateName);
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    const subject = replaceVariables(template.subject, variables);
    const body = replaceVariables(template.body, variables);

    return await sendEmail(to, subject, body);
  } catch (error) {
    console.error('Email template error:', error);
    throw error;
  }
};

// Send email
export const sendEmail = async (to, subject, html, text = null) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('SMTP not configured. Email not sent.');
      return { success: false, message: 'SMTP not configured' };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text: text || html,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

// Send leave approval notification
export const sendLeaveApprovalEmail = async (employeeEmail, employeeName, startDate, endDate) => {
  return await sendEmailWithTemplate(employeeEmail, 'leave_approved', {
    employee_name: employeeName,
    start_date: startDate,
    end_date: endDate,
  });
};

// Send leave rejection notification
export const sendLeaveRejectionEmail = async (employeeEmail, employeeName, startDate, endDate, reason) => {
  return await sendEmailWithTemplate(employeeEmail, 'leave_rejected', {
    employee_name: employeeName,
    start_date: startDate,
    end_date: endDate,
    reason: reason || 'Not specified',
  });
};

// Send payslip notification
export const sendPayslipEmail = async (employeeEmail, employeeName, month, year) => {
  return await sendEmailWithTemplate(employeeEmail, 'payslip_generated', {
    employee_name: employeeName,
    month,
    year,
  });
};

// Send attendance reminder
export const sendAttendanceReminder = async (employeeEmail, employeeName) => {
  return await sendEmailWithTemplate(employeeEmail, 'attendance_reminder', {
    employee_name: employeeName,
  });
};


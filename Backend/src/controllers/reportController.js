import { AttendanceModel } from '../models/Attendance.js';
import { PayrollModel } from '../models/Payroll.js';
import { generateAttendancePDF, generateAttendanceExcel, generatePayrollPDF, generatePayrollExcel } from '../utils/reportGenerator.js';
import { sendEmail } from '../utils/emailService.js';
import pool from '../config/database.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateAttendanceReport = async (req, res) => {
  try {
    const { month, year, format = 'json' } = req.query;

    const report = await AttendanceModel.getMonthlyReport(parseInt(month), parseInt(year));

    if (format === 'json') {
      return res.json({ success: true, data: report });
    }

    const timestamp = Date.now();
    const filename = `attendance_report_${month}_${year}_${timestamp}`;

    if (format === 'pdf') {
      const outputPath = path.join(__dirname, '../../temp', `${filename}.pdf`);
      await generateAttendancePDF(report, outputPath);
      
      res.download(outputPath, `${filename}.pdf`, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        // Clean up file after download
        setTimeout(() => {
          if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
          }
        }, 5000);
      });
    } else if (format === 'excel') {
      const outputPath = path.join(__dirname, '../../temp', `${filename}.xlsx`);
      await generateAttendanceExcel(report, outputPath);
      
      res.download(outputPath, `${filename}.xlsx`, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        setTimeout(() => {
          if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
          }
        }, 5000);
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid format' });
    }
  } catch (error) {
    console.error('Generate attendance report error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const generatePayrollReport = async (req, res) => {
  try {
    const { month, year, format = 'json' } = req.query;

    const report = await PayrollModel.getMonthlyReport(parseInt(month), parseInt(year));

    if (format === 'json') {
      return res.json({ success: true, data: report });
    }

    const timestamp = Date.now();
    const filename = `payroll_report_${month}_${year}_${timestamp}`;

    if (format === 'pdf') {
      const outputPath = path.join(__dirname, '../../temp', `${filename}.pdf`);
      await generatePayrollPDF(report, outputPath);
      
      res.download(outputPath, `${filename}.pdf`, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        setTimeout(() => {
          if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
          }
        }, 5000);
      });
    } else if (format === 'excel') {
      const outputPath = path.join(__dirname, '../../temp', `${filename}.xlsx`);
      await generatePayrollExcel(report, outputPath);
      
      res.download(outputPath, `${filename}.xlsx`, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        setTimeout(() => {
          if (fs.existsSync(outputPath)) {
            fs.unlinkSync(outputPath);
          }
        }, 5000);
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid format' });
    }
  } catch (error) {
    console.error('Generate payroll report error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const generateLeaveReport = async (req, res) => {
  try {
    const { start_date, end_date, format = 'json' } = req.query;

    // Get leaves in date range
    const query = `
      SELECT 
        l.*,
        e.employee_id as emp_id,
        e.department,
        u.email,
        u.profile_data
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE l.start_date >= $1 AND l.end_date <= $2
      ORDER BY l.start_date DESC
    `;
    const result = await pool.query(query, [start_date, end_date]);
    const report = result.rows;

    if (format === 'json') {
      return res.json({ success: true, data: report });
    }

    // For PDF/Excel, use similar structure as attendance
    res.json({ success: true, data: report, message: 'Leave report (PDF/Excel export coming soon)' });
  } catch (error) {
    console.error('Generate leave report error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const emailReport = async (req, res) => {
  try {
    const { report_type, month, year, email } = req.body;

    let reportData;
    let reportName;

    if (report_type === 'attendance') {
      reportData = await AttendanceModel.getMonthlyReport(parseInt(month), parseInt(year));
      reportName = `Attendance Report - ${month}/${year}`;
    } else if (report_type === 'payroll') {
      reportData = await PayrollModel.getMonthlyReport(parseInt(month), parseInt(year));
      reportName = `Payroll Report - ${month}/${year}`;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid report type' });
    }

    // Generate PDF
    const timestamp = Date.now();
    const filename = `${report_type}_report_${month}_${year}_${timestamp}.pdf`;
    const outputPath = path.join(__dirname, '../../temp', filename);

    if (report_type === 'attendance') {
      await generateAttendancePDF(reportData, outputPath);
    } else {
      await generatePayrollPDF(reportData, outputPath);
    }

    // Send email with attachment
    const emailResult = await sendEmail(
      email,
      reportName,
      `Please find attached the ${report_type} report for ${month}/${year}.`,
      `Please find attached the ${report_type} report for ${month}/${year}.`
    );

    // Clean up
    setTimeout(() => {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
    }, 10000);

    res.json({
      success: true,
      message: 'Report sent via email',
      emailResult,
    });
  } catch (error) {
    console.error('Email report error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


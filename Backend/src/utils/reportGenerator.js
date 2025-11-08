import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

export const generateAttendancePDF = async (data, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('Attendance Report', { align: 'center' });
      doc.moveDown();

      // Table header
      doc.fontSize(12);
      doc.text('Employee ID', 50, 100);
      doc.text('Name', 150, 100);
      doc.text('Date', 300, 100);
      doc.text('Check In', 400, 100);
      doc.text('Check Out', 500, 100);
      doc.text('Status', 600, 100);

      let y = 130;
      data.forEach((record) => {
        doc.text(record.emp_id || '', 50, y);
        doc.text(record.profile_data?.name || '', 150, y);
        doc.text(record.date || '', 300, y);
        doc.text(record.check_in || '-', 400, y);
        doc.text(record.check_out || '-', 500, y);
        doc.text(record.status || '', 600, y);
        y += 20;
      });

      doc.end();
      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

export const generatePayrollPDF = async (data, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      doc.fontSize(20).text('Payroll Report', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12);
      doc.text('Employee ID', 50, 100);
      doc.text('Name', 150, 100);
      doc.text('Basic Salary', 300, 100);
      doc.text('Allowances', 400, 100);
      doc.text('Deductions', 500, 100);
      doc.text('Net Salary', 600, 100);

      let y = 130;
      data.forEach((record) => {
        doc.text(record.emp_id || '', 50, y);
        doc.text(record.profile_data?.name || '', 150, y);
        doc.text(record.basic_salary?.toString() || '0', 300, y);
        doc.text(JSON.stringify(record.allowances || {}), 400, y);
        doc.text(JSON.stringify(record.deductions || {}), 500, y);
        doc.text(record.net_salary?.toString() || '0', 600, y);
        y += 20;
      });

      doc.end();
      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

export const generateAttendanceExcel = async (data, outputPath) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Attendance Report');

  // Headers
  worksheet.columns = [
    { header: 'Employee ID', key: 'emp_id', width: 15 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Check In', key: 'check_in', width: 12 },
    { header: 'Check Out', key: 'check_out', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
  ];

  // Add data
  data.forEach((record) => {
    worksheet.addRow({
      emp_id: record.emp_id || '',
      name: record.profile_data?.name || '',
      date: record.date || '',
      check_in: record.check_in || '-',
      check_out: record.check_out || '-',
      status: record.status || '',
    });
  });

  await workbook.xlsx.writeFile(outputPath);
  return outputPath;
};

export const generatePayrollExcel = async (data, outputPath) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Payroll Report');

  worksheet.columns = [
    { header: 'Employee ID', key: 'emp_id', width: 15 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Basic Salary', key: 'basic_salary', width: 15 },
    { header: 'Allowances', key: 'allowances', width: 20 },
    { header: 'Deductions', key: 'deductions', width: 20 },
    { header: 'Net Salary', key: 'net_salary', width: 15 },
  ];

  data.forEach((record) => {
    worksheet.addRow({
      emp_id: record.emp_id || '',
      name: record.profile_data?.name || '',
      basic_salary: record.basic_salary || 0,
      allowances: JSON.stringify(record.allowances || {}),
      deductions: JSON.stringify(record.deductions || {}),
      net_salary: record.net_salary || 0,
    });
  });

  await workbook.xlsx.writeFile(outputPath);
  return outputPath;
};


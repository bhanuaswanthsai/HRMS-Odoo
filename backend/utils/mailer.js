const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

let transporter;

function normalizeBool(val, fallback = false) {
  if (val === undefined || val === null || val === '') return fallback;
  const s = String(val).trim().toLowerCase();
  if (s === 'true' || s === '1' || s === 'yes') return true;
  if (s === 'false' || s === '0' || s === 'no') return false;
  return fallback;
}

function getTransporter() {
  if (transporter) return transporter;

  let { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;

  // Trim whitespace
  SMTP_HOST = SMTP_HOST && String(SMTP_HOST).trim();
  SMTP_PORT = SMTP_PORT && String(SMTP_PORT).trim();
  SMTP_USER = SMTP_USER && String(SMTP_USER).trim();
  // Remove spaces from app passwords that may be pasted with spaces
  SMTP_PASS = SMTP_PASS && String(SMTP_PASS).replace(/\s+/g, '');

  const missing = [];
  if (!SMTP_HOST) missing.push('SMTP_HOST');
  if (!SMTP_PORT) missing.push('SMTP_PORT');
  if (!SMTP_USER) missing.push('SMTP_USER');
  if (!SMTP_PASS) missing.push('SMTP_PASS');

  if (missing.length) {
    throw new Error(`SMTP configuration is missing: ${missing.join(', ')}`);
  }

  const portNum = Number(SMTP_PORT) || 587;
  const secure = SMTP_SECURE !== undefined ? normalizeBool(SMTP_SECURE) : portNum === 465;

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: portNum,
    secure,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  const { MAIL_FROM, FROM_EMAIL, FROM_NAME } = process.env;
  let fromHeader = MAIL_FROM && String(MAIL_FROM).trim();
  if (!fromHeader) {
    const email = (FROM_EMAIL && String(FROM_EMAIL).trim()) || 'no-reply@example.com';
    const name = (FROM_NAME && String(FROM_NAME).trim()) || 'WorkZen HRMS';
    fromHeader = `${name} <${email}>`;
  }

  const transporter = getTransporter();
  return transporter.sendMail({
    from: fromHeader,
    to,
    subject,
    text,
    html,
  });
}

module.exports = { sendMail };

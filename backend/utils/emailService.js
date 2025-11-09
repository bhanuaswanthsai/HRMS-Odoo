const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true' ? true : false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER, // Your email
    pass: process.env.SMTP_PASSWORD, // Your email password or app password
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email service configuration error:', error);
    console.error('Error code:', error.code);
    console.error('Error command:', error.command);
    if (error.code === 'EAUTH') {
      console.error('⚠️  Authentication failed! For Gmail, you need to use an App Password, not your regular password.');
      console.error('   Steps to fix:');
      console.error('   1. Go to: https://myaccount.google.com/security');
      console.error('   2. Enable 2-Step Verification');
      console.error('   3. Go to App passwords and create one for "Mail"');
      console.error('   4. Use that 16-character password in SMTP_PASSWORD');
    }
  } else {
    console.log('✅ Email service is ready to send emails');
  }
});

/**
 * Send welcome email to new employee with login credentials
 * @param {Object} employeeData - Employee information
 * @param {string} employeeData.email - Employee email
 * @param {string} employeeData.firstName - Employee first name
 * @param {string} employeeData.lastName - Employee last name
 * @param {string} employeeData.loginId - Generated login ID
 * @param {string} employeeData.password - Temporary password
 * @param {string} employeeData.companyName - Company name
 * @param {string} employeeData.companyLogo - Company logo (base64 encoded)
 * @param {string} employeeData.portalUrl - Portal login URL
 */
const sendWelcomeEmail = async (employeeData) => {
  const {
    email,
    firstName,
    lastName,
    loginId,
    password,
    companyName,
    companyLogo,
    portalUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  } = employeeData;

  const fullName = `${firstName} ${lastName}`;

  // HTML email template
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${companyName || 'HRMS'}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 30px;
          margin: 20px 0;
        }
        .header {
          background-color: #2563eb;
          color: white;
          padding: 20px;
          border-radius: 8px 8px 0 0;
          text-align: center;
        }
        .content {
          background-color: white;
          padding: 30px;
          border-radius: 0 0 8px 8px;
        }
        .credentials {
          background-color: #f3f4f6;
          border-left: 4px solid #2563eb;
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .credential-item {
          margin: 10px 0;
          padding: 10px;
          background-color: white;
          border-radius: 4px;
        }
        .credential-label {
          font-weight: bold;
          color: #666;
          font-size: 14px;
        }
        .credential-value {
          font-size: 18px;
          color: #1f2937;
          font-family: 'Courier New', monospace;
          margin-top: 5px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: #2563eb;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: bold;
        }
        .warning {
          background-color: #fef3c7;
          border: 1px solid #f59e0b;
          color: #92400e;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          color: #666;
          font-size: 12px;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        .company-logo {
          max-width: 200px;
          max-height: 80px;
          margin: 20px auto;
          display: block;
          object-fit: contain;
        }
        .thank-you {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to ${companyName || 'HRMS'}!</h1>
        </div>
        <div class="content">
          <p>Dear ${fullName},</p>
          
          <p>Welcome to ${companyName || 'our organization'}! Your account has been successfully created in our Human Resource Management System (HRMS).</p>
          
          <div class="credentials">
            <h2 style="margin-top: 0; color: #2563eb;">Your Login Credentials</h2>
            <div class="credential-item">
              <div class="credential-label">Login ID:</div>
              <div class="credential-value">${loginId}</div>
            </div>
            <div class="credential-item">
              <div class="credential-label">Temporary Password:</div>
              <div class="credential-value">${password}</div>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="${portalUrl}/login" class="button">Login to Portal</a>
          </div>
          
          <div class="warning">
            <strong>⚠️ Important Security Notice:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>You <strong>must change your password</strong> on your first login</li>
              <li>Do not share your credentials with anyone</li>
              <li>Keep your password secure and confidential</li>
            </ul>
          </div>
          
          <p>You can use either your <strong>Login ID</strong> or <strong>Email</strong> to log in to the portal.</p>
          
          <p>If you have any questions or need assistance, please contact your HR department.</p>
          
          <div class="thank-you">
            <p style="font-size: 16px; color: #2563eb; font-weight: bold; margin-bottom: 10px;">Thank You!</p>
            ${companyLogo ? `<img src="${companyLogo}" alt="${companyName || 'Company'} Logo" class="company-logo" />` : ''}
            <p style="margin-top: 15px;">Best regards,<br>
            <strong>${companyName || 'HRMS'} Team</strong></p>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} ${companyName || 'HRMS'}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Plain text version
  const textContent = `
Welcome to ${companyName || 'HRMS'}!

Dear ${fullName},

Welcome to ${companyName || 'our organization'}! Your account has been successfully created in our Human Resource Management System (HRMS).

Your Login Credentials:
- Login ID: ${loginId}
- Temporary Password: ${password}

Portal URL: ${portalUrl}/login

IMPORTANT SECURITY NOTICE:
- You MUST change your password on your first login
- Do not share your credentials with anyone
- Keep your password secure and confidential

You can use either your Login ID or Email to log in to the portal.

If you have any questions or need assistance, please contact your HR department.

Best regards,
${companyName || 'HRMS'} Team
${companyLogo ? `<img src="${companyLogo}" alt="${companyName || 'Company'} Logo" class="company-logo" />` : ''}
---
This is an automated email. Please do not reply to this message.
© ${new Date().getFullYear()} ${companyName || 'HRMS'}. All rights reserved.
  `;

  // Validate email address
  if (!email || !email.includes('@')) {
    console.error('❌ Invalid email address:', email);
    return {
      success: false,
      error: 'Invalid email address',
    };
  }

  // Email options
  const mailOptions = {
    from: `"${companyName || 'HRMS'}" <${process.env.SMTP_USER}>`,
    to: email.trim(), // Trim whitespace
    subject: `Welcome to ${companyName || 'HRMS'} - Your Login Credentials`,
    text: textContent,
    html: htmlContent,
    // Add headers for better delivery
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'high'
    }
  };

  try {
    console.log(`📧 Attempting to send welcome email...`);
    console.log(`   To: ${email}`);
    console.log(`   From: ${process.env.SMTP_USER}`);
    console.log(`   SMTP: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
    console.log(`   Subject: Welcome to ${companyName || 'HRMS'} - Your Login Credentials`);
    
    const info = await transporter.sendMail(mailOptions);
    console.log('');
    console.log('✅ Welcome email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   To:', email);
    console.log('   Response:', info.response);
    console.log('');
    console.log('⚠️  IMPORTANT REMINDERS:');
    console.log('   1. Email delivery can take 5-15 minutes');
    console.log('   2. Check the employee\'s SPAM/JUNK folder');
    console.log('   3. Verify the email address is correct:', email);
    console.log('   4. Some email providers filter emails aggressively');
    console.log('');
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('❌ Error sending welcome email:');
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);
    console.error('   Response:', error.response);
    console.error('   Command:', error.command);
    
    // Provide helpful error messages
    if (error.code === 'EAUTH') {
      console.error('   ⚠️  Authentication failed!');
      console.error('   For Gmail: Use an App Password, not your regular password.');
      console.error('   Get App Password: https://myaccount.google.com/apppasswords');
    } else if (error.code === 'ECONNECTION') {
      console.error('   ⚠️  Connection failed! Check your internet and SMTP settings.');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('   ⚠️  Connection timeout! Check SMTP_HOST and SMTP_PORT.');
    }
    
    return {
      success: false,
      error: error.message,
      errorCode: error.code,
    };
  }
};

module.exports = {
  sendWelcomeEmail,
};


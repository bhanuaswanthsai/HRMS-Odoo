// Direct email test script with detailed error reporting
// Run with: node test-email-direct.js

require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmailDirect() {
  console.log('='.repeat(60));
  console.log('EMAIL CONFIGURATION TEST');
  console.log('='.repeat(60));
  console.log('');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('   SMTP_HOST:', process.env.SMTP_HOST || '❌ NOT SET');
  console.log('   SMTP_PORT:', process.env.SMTP_PORT || '❌ NOT SET');
  console.log('   SMTP_SECURE:', process.env.SMTP_SECURE || 'false');
  console.log('   SMTP_USER:', process.env.SMTP_USER || '❌ NOT SET');
  console.log('   SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '***' + process.env.SMTP_PASSWORD.slice(-4) : '❌ NOT SET');
  console.log('   FRONTEND_URL:', process.env.FRONTEND_URL || 'http://localhost:5173');
  console.log('');

  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error('❌ ERROR: SMTP_USER and SMTP_PASSWORD must be set in .env file');
    process.exit(1);
  }

  // Create transporter
  console.log('🔧 Creating email transporter...');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    debug: true, // Enable debug output
    logger: true, // Log to console
  });

  // Test connection
  console.log('🔍 Verifying SMTP connection...');
  console.log('');
  
  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');
    console.log('');
  } catch (error) {
    console.error('❌ SMTP verification failed!');
    console.error('');
    console.error('Error Details:');
    console.error('   Code:', error.code);
    console.error('   Message:', error.message);
    console.error('   Command:', error.command);
    console.error('');
    
    if (error.code === 'EAUTH') {
      console.error('🔐 AUTHENTICATION ERROR');
      console.error('');
      console.error('For Gmail users:');
      console.error('   1. Go to: https://myaccount.google.com/security');
      console.error('   2. Enable 2-Step Verification (if not already enabled)');
      console.error('   3. Go to: https://myaccount.google.com/apppasswords');
      console.error('   4. Create a new App Password for "Mail"');
      console.error('   5. Copy the 16-character password (e.g., "abcd efgh ijkl mnop")');
      console.error('   6. Update SMTP_PASSWORD in your .env file with this App Password');
      console.error('');
      console.error('⚠️  DO NOT use your regular Gmail password!');
      console.error('   Gmail blocks regular passwords for security reasons.');
      console.error('');
    } else if (error.code === 'ECONNECTION') {
      console.error('🌐 CONNECTION ERROR');
      console.error('   Check your internet connection and firewall settings.');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('⏱️  TIMEOUT ERROR');
      console.error('   Check SMTP_HOST and SMTP_PORT settings.');
    }
    
    process.exit(1);
  }

  // Send test email
  console.log('📧 Sending test email...');
  console.log('');
  
  const testEmail = process.env.SMTP_USER; // Send to yourself
  const mailOptions = {
    from: `"HRMS Test" <${process.env.SMTP_USER}>`,
    to: testEmail,
    subject: 'HRMS Email Test - Configuration Working!',
    text: `
This is a test email from your HRMS system.

If you received this email, your email configuration is working correctly!

Test Details:
- SMTP Host: ${process.env.SMTP_HOST}
- SMTP Port: ${process.env.SMTP_PORT}
- From: ${process.env.SMTP_USER}
- To: ${testEmail}
- Time: ${new Date().toISOString()}

Next steps:
1. Check your inbox (and spam folder) for this test email
2. If you received it, your email configuration is correct
3. Try creating a new employee - the welcome email should be sent automatically

Best regards,
HRMS System
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">HRMS Email Test</h2>
        <p>This is a test email from your HRMS system.</p>
        <p><strong>If you received this email, your email configuration is working correctly!</strong></p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Test Details:</h3>
          <ul>
            <li>SMTP Host: ${process.env.SMTP_HOST}</li>
            <li>SMTP Port: ${process.env.SMTP_PORT}</li>
            <li>From: ${process.env.SMTP_USER}</li>
            <li>To: ${testEmail}</li>
            <li>Time: ${new Date().toISOString()}</li>
          </ul>
        </div>
        
        <div style="background-color: #dbeafe; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Next Steps:</h3>
          <ol>
            <li>Check your inbox (and spam folder) for this test email</li>
            <li>If you received it, your email configuration is correct</li>
            <li>Try creating a new employee - the welcome email should be sent automatically</li>
          </ol>
        </div>
        
        <p>Best regards,<br>HRMS System</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('');
    console.log('Email Details:');
    console.log('   Message ID:', info.messageId);
    console.log('   To:', testEmail);
    console.log('   Response:', info.response);
    console.log('');
    console.log('📬 Please check your inbox (and spam/junk folder) for the test email.');
    console.log('');
    console.log('If you received the email:');
    console.log('   ✅ Your email configuration is working correctly!');
    console.log('   ✅ You can now create employees and they will receive welcome emails.');
    console.log('');
    console.log('If you did NOT receive the email:');
    console.log('   1. Check your spam/junk folder');
    console.log('   2. Wait a few minutes (email delivery can be delayed)');
    console.log('   3. Verify the email address in SMTP_USER is correct');
    console.log('   4. Check your email provider\'s security settings');
    console.log('');
  } catch (error) {
    console.error('❌ Failed to send test email!');
    console.error('');
    console.error('Error Details:');
    console.error('   Code:', error.code);
    console.error('   Message:', error.message);
    console.error('   Response:', error.response);
    console.error('');
    process.exit(1);
  }
}

testEmailDirect();


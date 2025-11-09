// Quick test script to verify email configuration
// Run with: node test-email.js

require('dotenv').config();
const { sendWelcomeEmail } = require('./utils/emailService');

async function testEmail() {
  console.log('Testing email configuration...');
  console.log('SMTP_HOST:', process.env.SMTP_HOST || 'Not set');
  console.log('SMTP_USER:', process.env.SMTP_USER || 'Not set');
  console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '***' : 'Not set');
  console.log('');

  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error('❌ Error: SMTP_USER and SMTP_PASSWORD must be set in .env file');
    process.exit(1);
  }

  // Test email (change this to your email address)
  const testEmail = process.env.SMTP_USER; // Send to yourself for testing

  try {
    console.log(`Sending test email to: ${testEmail}`);
    const result = await sendWelcomeEmail({
      email: testEmail,
      firstName: 'Test',
      lastName: 'User',
      loginId: 'TEST123456',
      password: 'TestPass123',
      companyName: 'HRMS Test',
      portalUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
    });

    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log('Message ID:', result.messageId);
      console.log('Check your inbox for the test email.');
    } else {
      console.error('❌ Failed to send test email:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testEmail();


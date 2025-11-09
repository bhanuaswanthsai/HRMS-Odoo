// Debug script to test sending email to a specific address
// Usage: node debug-email.js <email-address>

require('dotenv').config();
const { sendWelcomeEmail } = require('./utils/emailService');

const emailAddress = process.argv[2];

if (!emailAddress) {
  console.error('❌ Error: Please provide an email address');
  console.log('');
  console.log('Usage: node debug-email.js <email-address>');
  console.log('Example: node debug-email.js employee@example.com');
  process.exit(1);
}

async function debugEmail() {
  console.log('='.repeat(60));
  console.log('DEBUG EMAIL SENDING');
  console.log('='.repeat(60));
  console.log('');
  console.log('Email Configuration:');
  console.log('   SMTP_HOST:', process.env.SMTP_HOST);
  console.log('   SMTP_PORT:', process.env.SMTP_PORT);
  console.log('   SMTP_USER:', process.env.SMTP_USER);
  console.log('   To:', emailAddress);
  console.log('');

  console.log('Sending test welcome email...');
  console.log('');

  const result = await sendWelcomeEmail({
    email: emailAddress,
    firstName: 'Test',
    lastName: 'Employee',
    loginId: 'TEST123456',
    password: 'TestPass123',
    companyName: 'HRMS Test Company',
    portalUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
  });

  console.log('');
  console.log('='.repeat(60));

  if (result.success) {
    console.log('✅ Email sent successfully!');
    console.log('   Message ID:', result.messageId);
    console.log('');
    console.log('Next steps:');
    console.log('   1. Check the inbox for:', emailAddress);
    console.log('   2. Check the spam/junk folder');
    console.log('   3. Wait a few minutes (email delivery can be delayed)');
    console.log('   4. Verify the email address is correct');
  } else {
    console.log('❌ Email sending failed!');
    console.log('   Error:', result.error);
    if (result.errorCode) {
      console.log('   Error Code:', result.errorCode);
    }
  }
}

debugEmail().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});


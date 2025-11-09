// Script to check what email was used for the last created employee
// Run with: node check-employee-email.js

require('dotenv').config();
const { pool } = require('./config/database');
const { sendWelcomeEmail } = require('./utils/emailService');

async function checkLastEmployee() {
  try {
    console.log('='.repeat(60));
    console.log('CHECKING LAST CREATED EMPLOYEE');
    console.log('='.repeat(60));
    console.log('');

    // Get the last created employee
    const result = await pool.query(`
      SELECT id, name, first_name, last_name, email, login_id, created_at, company_name
      FROM users 
      WHERE role != 'admin' OR created_at > NOW() - INTERVAL '1 hour'
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    if (result.rows.length === 0) {
      console.log('No employees found in the database.');
      return;
    }

    console.log(`Found ${result.rows.length} recent employee(s):\n`);

    for (const employee of result.rows) {
      console.log('─'.repeat(60));
      console.log('Employee Details:');
      console.log('   ID:', employee.id);
      console.log('   Name:', employee.name);
      console.log('   Email:', employee.email);
      console.log('   Login ID:', employee.login_id);
      console.log('   Company:', employee.company_name || 'N/A');
      console.log('   Created:', employee.created_at);
      console.log('');

      // Ask if we should send a test email
      console.log('📧 To send a test welcome email to this employee,');
      console.log('   we would need their temporary password from when they were created.');
      console.log('');
    }

    console.log('─'.repeat(60));
    console.log('');
    console.log('💡 Tip: When creating a new employee, check:');
    console.log('   1. The email address is correct');
    console.log('   2. The email address exists');
    console.log('   3. Check your server console for email sending logs');
    console.log('   4. Check the employee\'s spam folder');
    console.log('');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkLastEmployee();


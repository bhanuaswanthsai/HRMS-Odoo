const { pool } = require('./database');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...');

    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');

    // Create default admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminEmail = 'admin@workzen.com';

    // Check if admin already exists
    const adminCheck = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    
    if (adminCheck.rows.length === 0) {
      const currentYear = new Date().getFullYear();
      const loginId = `adus${currentYear}001`;
      const firstName = 'Admin';
      const lastName = 'User';
      
      await pool.query(
        `INSERT INTO users (name, first_name, last_name, email, login_id, password_hash, role, department, base_salary, status, password_changed, year_of_joining, employee_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        ['Admin User', firstName, lastName, adminEmail, loginId, adminPassword, 'admin', 'Administration', 0, 'active', true, currentYear, 1]
      );
      console.log('✅ Default admin user created');
      console.log('   Login ID: ' + loginId);
      console.log('   Email: admin@workzen.com');
      console.log('   Password: admin123');
    } else {
      // Update existing admin to have login_id if missing
      const adminUser = adminCheck.rows[0];
      const updateCheck = await pool.query('SELECT login_id FROM users WHERE id = $1', [adminUser.id]);
      if (!updateCheck.rows[0].login_id) {
        const currentYear = new Date().getFullYear();
        const loginId = `adus${currentYear}001`;
        await pool.query(
          `UPDATE users SET login_id = $1, first_name = $2, last_name = $3, password_changed = true, year_of_joining = $4, employee_number = 1 WHERE id = $5`,
          [loginId, 'Admin', 'User', currentYear, adminUser.id]
        );
        console.log('✅ Updated admin user with Login ID: ' + loginId);
      }
      console.log('ℹ️  Admin user already exists');
    }

    console.log('✅ Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    console.error('Make sure the database schema has been created first!');
    console.error('Run: psql -U postgres -d Hrms1 -f config/database.sql');
    process.exit(1);
  }
}

seedDatabase();


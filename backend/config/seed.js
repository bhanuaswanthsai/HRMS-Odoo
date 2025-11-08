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
      await pool.query(
        `INSERT INTO users (name, email, password_hash, role, department, base_salary, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['Admin User', adminEmail, adminPassword, 'admin', 'Administration', 0, 'active']
      );
      console.log('✅ Default admin user created');
      console.log('   Email: admin@workzen.com');
      console.log('   Password: admin123');
    } else {
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


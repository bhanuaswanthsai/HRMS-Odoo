import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'hrms',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function setupDatabase() {
  try {
    console.log('Setting up database...');

    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Creating tables...');
    await pool.query(schemaSQL);
    console.log('✅ Tables created successfully!');

    // Read and execute settings_schema.sql if it exists
    const settingsSchemaPath = path.join(__dirname, 'settings_schema.sql');
    if (fs.existsSync(settingsSchemaPath)) {
      console.log('Creating settings tables...');
      const settingsSQL = fs.readFileSync(settingsSchemaPath, 'utf8');
      await pool.query(settingsSQL);
      console.log('✅ Settings tables created successfully!');
    }

    // Read and execute seed.sql
    const seedPath = path.join(__dirname, 'seed.sql');
    if (fs.existsSync(seedPath)) {
      console.log('Inserting default admin user...');
      const seedSQL = fs.readFileSync(seedPath, 'utf8');
      await pool.query(seedSQL);
      console.log('✅ Default admin user created!');
      console.log('   Email: admin@hrms.com');
      console.log('   Password: admin123');
    }

    console.log('\n✅ Database setup completed successfully!');
    console.log('You can now start the server with: npm run dev');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();


# Database Setup

This directory contains the database schema and seed data for the HRMS application.

## Files

- `schema.sql` - Complete database schema with all tables, indexes, and triggers
- `settings_schema.sql` - Settings, email templates, and notifications tables
- `seed.sql` - Default admin user for initial setup
- `setup.js` - Automated database setup script

## Quick Setup (Recommended)

1. **Create the database** (if not exists):
   ```sql
   CREATE DATABASE hrms;
   ```

2. **Configure `.env` file** in `Backend` directory with database credentials

3. **Run the automated setup**:
   ```bash
   cd Backend
   npm run db:setup
   ```

   This will automatically:
   - Create all database tables
   - Create settings tables
   - Insert the default admin user

## Manual Setup

1. Make sure PostgreSQL is installed and running on your system.

2. Create a new database:
   ```sql
   CREATE DATABASE hrms;
   ```

3. Run the schema file to create all tables:
   ```bash
   psql -U postgres -d hrms -f schema.sql
   ```

4. Run the settings schema (if exists):
   ```bash
   psql -U postgres -d hrms -f settings_schema.sql
   ```

5. Run the seed file to create default admin user:
   ```bash
   psql -U postgres -d hrms -f seed.sql
   ```

## Database Schema Overview

### Tables

1. **users** - Authentication and basic user information
2. **employees** - Employee-specific information
3. **attendance** - Daily attendance records
4. **leaves** - Leave requests and approvals
5. **payroll** - Monthly payroll information
6. **payslips** - Generated payslip documents
7. **leave_balance** - Available leave balances per employee

## Notes

- All tables use UUID as primary keys
- Timestamps are automatically managed with triggers
- Foreign key constraints ensure data integrity
- Indexes are created for commonly queried fields


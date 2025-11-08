# Quick Database Setup Guide

## Error: "relation 'users' does not exist"

This error means the database tables haven't been created yet. Follow these steps:

## Option 1: Using Setup Script (Recommended)

1. **Make sure your `.env` file is configured** in the `Backend` directory:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=hrms
   DB_USER=postgres
   DB_PASSWORD=your_password_here
   ```

2. **Run the setup script**:
   ```bash
   cd Backend
   npm run db:setup
   ```

   This will:
   - Create all database tables
   - Create settings tables
   - Insert the default admin user

## Option 2: Manual Setup (Using psql)

1. **Create the database** (if not exists):
   ```sql
   CREATE DATABASE hrms;
   ```

2. **Run the schema file**:
   ```bash
   cd Backend/database
   psql -U postgres -d hrms -f schema.sql
   ```

3. **Run the settings schema** (if exists):
   ```bash
   psql -U postgres -d hrms -f settings_schema.sql
   ```

4. **Run the seed file**:
   ```bash
   psql -U postgres -d hrms -f seed.sql
   ```

## Verify Setup

After running the setup, verify the tables exist:

```sql
\dt
```

You should see tables like:
- users
- employees
- attendance
- leaves
- payroll
- payslips
- leave_balance
- settings
- email_templates
- notifications

## Default Admin Credentials

After setup, you can login with:
- **Email**: `admin@hrms.com`
- **Password**: `admin123`

⚠️ **Change this password immediately after first login!**

## Troubleshooting

### Connection Error
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database `hrms` exists

### Permission Error
- Make sure the PostgreSQL user has CREATE privileges
- Check if database exists: `\l` in psql

### Tables Still Don't Exist
- Check if you're connected to the correct database
- Verify schema.sql ran without errors
- Check PostgreSQL logs for errors


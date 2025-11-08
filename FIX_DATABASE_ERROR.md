# Fix: "relation 'users' does not exist" Error

## Problem
The error `relation "users" does not exist` means the database tables haven't been created yet.

## Quick Fix

### Step 1: Create Database (if not exists)

Open PostgreSQL (psql) and run:
```sql
CREATE DATABASE hrms;
```

### Step 2: Run Database Setup

**Option A: Using Setup Script (Easiest)**

1. Make sure your `.env` file in `Backend` directory has correct database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=hrms
   DB_USER=postgres
   DB_PASSWORD=your_password_here
   ```

2. Run the setup script:
   ```bash
   cd Backend
   npm run db:setup
   ```

**Option B: Manual Setup (Using psql)**

1. Open command prompt/terminal

2. Navigate to database folder:
   ```bash
   cd Backend\database
   ```

3. Run schema file:
   ```bash
   psql -U postgres -d hrms -f schema.sql
   ```

4. Run settings schema (if exists):
   ```bash
   psql -U postgres -d hrms -f settings_schema.sql
   ```

5. Run seed file:
   ```bash
   psql -U postgres -d hrms -f seed.sql
   ```

### Step 3: Verify Tables Created

Connect to database and check:
```sql
\c hrms
\dt
```

You should see tables: users, employees, attendance, leaves, payroll, etc.

### Step 4: Restart Server

After setup, restart your backend server:
```bash
cd Backend
npm run dev
```

## Default Admin Login

After setup, login with:
- **Email**: `admin@hrms.com`
- **Password**: `admin123`

⚠️ **Change password immediately after first login!**

## Still Having Issues?

1. **Check PostgreSQL is running**
   ```bash
   # Windows
   # Check Services or run:
   pg_ctl status
   ```

2. **Verify database exists**
   ```sql
   \l
   ```
   Look for `hrms` database

3. **Check connection in .env**
   - Verify DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
   - Make sure password is correct

4. **Check PostgreSQL user permissions**
   - User must have CREATE privileges
   - User must be able to connect to database

## Common Errors

### "database does not exist"
```sql
CREATE DATABASE hrms;
```

### "permission denied"
- Make sure you're using the correct PostgreSQL user
- User needs CREATE privileges

### "password authentication failed"
- Check password in `.env` file
- Verify PostgreSQL user password


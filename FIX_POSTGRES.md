# Fix PostgreSQL Authentication Error

## Problem
The error `auth_permission_dialog.dialog_executable_path is not a file` occurs because PostgreSQL is trying to use a password dialog authentication method that isn't properly configured.

## Solution

### Step 1: Open pg_hba.conf file
```bash
sudo nano /Library/PostgreSQL/18/data/pg_hba.conf
```

### Step 2: Find and modify these lines
Look for lines that contain `127.0.0.1`, `localhost`, or `::1` and change the authentication method to `md5`.

**Find lines like this:**
```
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
```

**Change to:**
```
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

### Step 3: Save and restart PostgreSQL
```bash
# Save the file (Ctrl+X, then Y, then Enter in nano)
# Restart PostgreSQL
sudo /Library/PostgreSQL/18/bin/pg_ctl -D /Library/PostgreSQL/18/data restart
```

### Alternative: Use the fix script
Run the provided script:
```bash
cd /Users/saiaditya/Desktop/HRMS-Odoo
./fix-postgres-auth.sh
```

## Quick Test
After fixing, test the connection:
```bash
/Library/PostgreSQL/18/bin/psql -U postgres -d HRMS -h 127.0.0.1
# Enter password: 0204
```

If you can connect, the fix worked!


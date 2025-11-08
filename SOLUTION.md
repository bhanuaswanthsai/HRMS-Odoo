# 🔧 Fix PostgreSQL Authentication Error

## The Problem
```
error: auth_permission_dialog.dialog_executable_path is not a file
```

This happens because PostgreSQL is configured to use a password dialog authentication method, but the dialog executable is missing or misconfigured.

## ✅ Solution (Choose One)

### Option 1: Quick Fix Using Terminal (Recommended)

Run these commands in your terminal:

```bash
# 1. Backup the configuration file
sudo cp /Library/PostgreSQL/18/data/pg_hba.conf /Library/PostgreSQL/18/data/pg_hba.conf.backup

# 2. Edit the file
sudo nano /Library/PostgreSQL/18/data/pg_hba.conf
```

In the editor, find lines that look like:
```
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
```

Change `scram-sha-256` to `md5`:
```
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

Save: Press `Ctrl+X`, then `Y`, then `Enter`

```bash
# 3. Restart PostgreSQL
sudo /Library/PostgreSQL/18/bin/pg_ctl -D /Library/PostgreSQL/18/data restart
```

### Option 2: Use the Fix Script

```bash
cd /Users/saiaditya/Desktop/HRMS-Odoo
./fix-postgres-auth.sh
```

### Option 3: Manual Edit with Text Editor

1. Open Finder
2. Press `Cmd+Shift+G`
3. Enter: `/Library/PostgreSQL/18/data/`
4. Find `pg_hba.conf`
5. Right-click → Open With → TextEdit (you'll need admin password)
6. Find lines with `127.0.0.1` or `::1`
7. Change authentication method from `scram-sha-256` to `md5`
8. Save the file
9. Restart PostgreSQL using the command above

## 🧪 Test the Fix

After fixing, test your connection:

```bash
/Library/PostgreSQL/18/bin/psql -U postgres -d HRMS -h 127.0.0.1
# Password: 0204
```

If you can connect, the fix worked! Now try running your Node.js server again.

## 📝 What Changed?

- **Before**: PostgreSQL tried to use a dialog executable for password prompts
- **After**: PostgreSQL uses `md5` password authentication (standard and reliable)

The `md5` authentication method is secure and works perfectly for local development.


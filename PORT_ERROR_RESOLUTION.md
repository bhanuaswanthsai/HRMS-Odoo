# Port Error Resolution Guide

## Error: `EADDRINUSE: address already in use :::5003`

### What This Error Means
This error occurs when you try to start the backend server, but port 5003 is already being used by another process (usually a previous instance of your server that didn't shut down properly).

### Why It Happens
1. **Previous server instance still running**: You closed the terminal but the Node.js process is still running
2. **Multiple server instances**: You accidentally started the server twice
3. **Server didn't shut down properly**: The server crashed but the process remained active

### How to Resolve It

#### Method 1: Use the PowerShell Script (Easiest)
I've created a helper script for you. Run this command in PowerShell:

```powershell
cd backend
.\kill-port.ps1 -Port 5003
```

This will automatically find and kill any process using port 5003.

#### Method 2: Manual PowerShell Commands
Run these commands in PowerShell:

```powershell
# Find the process using port 5003
netstat -ano | findstr :5003

# Kill the process (replace PID with the number from above)
taskkill /F /PID <PID>
```

#### Method 3: Find and Kill Process Manually
1. Open PowerShell
2. Run: `netstat -ano | findstr :5003`
3. Note the PID (Process ID) in the last column
4. Run: `taskkill /F /PID <PID>` (replace `<PID>` with the actual number)

### Prevention Tips

1. **Always stop the server properly**: 
   - Press `Ctrl + C` in the terminal where the server is running
   - Wait for the process to stop before closing the terminal

2. **Check if server is already running**:
   - Before starting, check: `netstat -ano | findstr :5003`
   - If you see output, kill the process first

3. **Use the kill script before starting**:
   ```powershell
   cd backend
   .\kill-port.ps1 -Port 5003
   npm run dev
   ```

### Quick Fix Command
If you just want to quickly fix it and start the server:

```powershell
# Kill any process on port 5003
Get-Process -Id (Get-NetTCPConnection -LocalPort 5003 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force

# Then start your server
cd backend
npm run dev
```

### Verification
After killing the process, verify the port is free:
```powershell
netstat -ano | findstr :5003
```
If no output appears, the port is free and you can start your server.

---

## Summary of All Changes Made

### ✅ 1. Employee Dashboard - Bar Chart Size
- **Fixed**: Reduced bar chart height from 300px to 200px
- **File**: `frontend/src/pages/Dashboard/EmployeeDashboard.jsx`
- **Status**: ✅ Working correctly

### ✅ 2. HR Dashboard - Attendance Edit Functionality
- **Fixed**: Added complete edit modal for attendance records
- **Features**:
  - Edit date, status, check-in time, check-out time
  - Works for both HR and Admin roles
  - Updates are saved to backend and reflected everywhere
- **File**: `frontend/src/pages/Attendance.jsx`
- **Status**: ✅ Working correctly

### ✅ 3. Admin Dashboard - Department Pie Chart
- **Fixed**: Converted from BarChart to PieChart with different colors
- **Features**:
  - Each department gets a unique color automatically
  - New departments automatically get different colors
  - Shows department names with percentages
- **File**: `frontend/src/pages/Dashboard/AdminDashboard.jsx`
- **Status**: ✅ Working correctly

---

## Next Steps

1. **Kill the process on port 5003** (use one of the methods above)
2. **Start the backend server**:
   ```powershell
   cd backend
   npm run dev
   ```
3. **Start the frontend** (in a new terminal):
   ```powershell
   cd frontend
   npm run dev
   ```

Everything should now work correctly!


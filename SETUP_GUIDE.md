# HRMS Setup Guide

## Initial Setup Instructions

### Step 1: Database Setup

1. **Create PostgreSQL Database**:
   ```sql
   CREATE DATABASE hrms;
   ```

2. **Run Schema**:
   ```bash
   cd Backend/database
   psql -U postgres -d hrms -f schema.sql
   ```

3. **Create Default Admin User**:
   ```bash
   psql -U postgres -d hrms -f seed.sql
   ```

### Step 2: Backend Setup

1. **Install Dependencies**:
   ```bash
   cd Backend
   npm install
   ```

2. **Create `.env` File**:
   ```env
   PORT=5000
   NODE_ENV=development
   
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=hrms
   DB_USER=postgres
   DB_PASSWORD=your_password_here
   
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d
   
   CORS_ORIGIN=http://localhost:3000
   ```

3. **Start Backend**:
   ```bash
   npm run dev
   ```

### Step 3: Frontend Setup

1. **Install Dependencies**:
   ```bash
   cd Frontend
   npm install
   ```

2. **Start Frontend**:
   ```bash
   npm run dev
   ```

### Step 4: First Login

1. **Open Application**: Navigate to `http://localhost:3000`

2. **Login as Admin**:
   - Email: `admin@hrms.com`
   - Password: `admin123`

3. **Change Password**: Immediately change the default admin password

4. **Add Users**: 
   - Click "Manage Users" button on dashboard
   - Add all users with appropriate roles:
     - **HR Officers**: For employee and leave management
     - **Payroll Officers**: For payroll processing
     - **Employees**: Regular users

## User Roles

### Admin
- Full system access
- User management (create, update, delete users)
- All employee management features
- All attendance, leave, and payroll features
- Reports and settings management

### HR Officer
- Employee management (create, update employees)
- Attendance management (view all)
- Leave management (approve/reject leaves)
- Cannot delete employees or manage users

### Payroll Officer
- Payroll processing
- View payroll reports
- Cannot manage employees or leaves

### Employee
- View own profile
- View own attendance
- Apply for leaves
- View own payroll
- Cannot access management features

## Workflow

1. **Admin logs in** with default credentials
2. **Admin creates users** with appropriate roles
3. **Users can then login** and access features based on their roles
4. **HR Officers** manage employees and approve leaves
5. **Payroll Officers** process monthly payroll
6. **Employees** use the system for attendance and leave requests

## Security Notes

- ⚠️ **Change default admin password immediately**
- Use strong passwords for all users
- Regularly update JWT_SECRET in production
- Keep database credentials secure
- Use environment variables for sensitive data

## Troubleshooting

### Cannot Login
- Verify database seed file was run
- Check database connection in `.env`
- Ensure backend server is running

### Permission Denied
- Verify user role in database
- Check JWT token is valid
- Ensure proper permissions are set

### Database Errors
- Verify PostgreSQL is running
- Check database credentials
- Ensure schema was created successfully


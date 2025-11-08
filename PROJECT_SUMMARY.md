# WorkZen HRMS - Project Summary

## Overview

WorkZen HRMS is a comprehensive Human Resource Management System built with modern web technologies. It supports role-based access control for four user types: Admin, HR Officer, Payroll Officer, and Employee.

## Technology Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **JWT** authentication
- **bcryptjs** for password hashing
- **PDFKit** for PDF generation
- **ExcelJS** for Excel export

### Frontend
- **React** with functional components and hooks
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **React Router** for navigation
- **Axios** for API calls
- **React Hot Toast** for notifications

## Database Schema

### Tables
1. **users** - User accounts with roles and assignments
2. **attendance** - Employee attendance records
3. **leaves** - Leave applications and approvals
4. **payroll** - Payroll calculations and payslips
5. **reports** - Cached report data (optional)

### Key Features
- Foreign key relationships with cascade deletes
- Unique constraints (user_id + date for attendance, user_id + month + year for payroll)
- Enum types for status fields
- Automatic timestamp updates

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user (Admin only)
- `POST /login` - User login
- `GET /profile` - Get current user profile
- `PUT /change-password` - Change password

### Users (`/api/users`)
- `GET /` - Get all users (Admin only)
- `GET /:id` - Get user by ID (HR/Admin)
- `POST /` - Create user (Admin only)
- `PUT /:id` - Update user (HR/Admin)
- `DELETE /:id` - Delete user (Admin only)
- `GET /list/hr` - Get HR officers list (Admin)
- `GET /assigned/mine` - Get assigned employees (HR)

### Attendance (`/api/attendance`)
- `POST /mark` - Mark attendance (Employee)
- `GET /:user_id` - Get attendance (Employee: own, HR/Admin: any)
- `GET /summary/all` - Get attendance summary (HR/Admin)
- `PUT /:id` - Update attendance (HR/Admin)

### Leaves (`/api/leave`)
- `POST /apply` - Apply for leave (Employee)
- `GET /my` - Get my leaves (Employee)
- `GET /pending` - Get pending leaves (HR/Admin)
- `GET /all` - Get all leaves (HR/Admin)
- `PUT /:id/approve` - Approve leave (HR/Admin)
- `PUT /:id/reject` - Reject leave (HR/Admin)
- `GET /types/list` - Get leave types

### Payroll (`/api/payroll`)
- `POST /generate` - Generate payroll (Payroll/Admin)
- `GET /:user_id` - Get payroll (Employee: own, Payroll/Admin: any)
- `GET /reports/all` - Get all payroll reports (Payroll/Admin)
- `GET /summary/dashboard` - Get payroll summary (Payroll/Admin)

### Reports (`/api/reports`)
- `GET /search` - Search employee reports (Admin/Payroll)
- `GET /download/:employee_id/pdf` - Download PDF report
- `GET /download/:employee_id/excel` - Download Excel report

## Frontend Pages

### Authentication
- **Login** - User login page

### Dashboards (Role-based)
- **Admin Dashboard** - Total employees, payroll costs, department breakdown, charts
- **HR Dashboard** - Team size, pending leaves, attendance rate, department chart
- **Payroll Dashboard** - Salary expenses, monthly trends, department-wise breakdown
- **Employee Dashboard** - Attendance graph, leave summary, latest payslips

### Main Pages
- **Users** (Admin only) - Create, edit, delete users, assign HR officers
- **Attendance** - Mark attendance (Employee), view all (HR/Admin), edit (HR/Admin)
- **Leaves** - Apply for leaves (Employee), approve/reject (HR/Admin)
- **Payroll** - Generate payroll (Payroll/Admin), view payslips (all)
- **Reports** (Admin/Payroll) - Search employees, view reports, download PDF/Excel
- **Profile** - View and edit profile, change password

## Key Features

### Role-Based Access Control
- **Admin**: Full system access
- **HR Officer**: Manage assigned employees, approve leaves
- **Payroll Officer**: Generate payroll, view reports
- **Employee**: Mark attendance, apply leaves, view own data

### Payroll Calculation
- Automatic calculation based on attendance and leaves
- PF deduction (12% of basic salary)
- Professional tax (₹200)
- Unpaid leave deductions
- Formula: `net_salary = basic_salary - (unpaid_leaves * daily_salary) - pf - tax`

### Leave Management
- Employees can apply for leaves
- HR/Admin can approve/reject
- Paid/Unpaid leave classification
- Leave types: Sick Leave, Casual Leave, Annual Leave, etc.

### Attendance Tracking
- Employees mark attendance once per day
- HR/Admin can override incorrect entries
- Status: Present, Absent, Leave
- Check-in/Check-out time tracking

### Reports & Analytics
- Employee search by name/ID
- Comprehensive employee reports
- PDF and Excel export
- Charts and visualizations
- Department-wise breakdowns

## Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Role-based middleware protection
- CORS configuration
- Input validation
- SQL injection protection (parameterized queries)

## Business Logic

### Attendance
- One attendance record per employee per day
- HR/Admin can edit attendance records
- Payroll uses attendance data for calculations

### Leaves
- Employees apply for leaves
- HR/Admin approves with paid/unpaid status
- Payroll deducts for unpaid leaves

### Payroll
- Generated monthly
- Calculates deductions automatically
- Stores payslip data
- Unique constraint per user per month/year

## File Structure

```
workzen-hrms/
├── backend/
│   ├── config/
│   │   ├── database.js
│   │   ├── database.sql
│   │   └── seed.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── attendance.js
│   │   ├── leave.js
│   │   ├── payroll.js
│   │   └── reports.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard/
│   │   │   ├── Users.jsx
│   │   │   ├── Attendance.jsx
│   │   │   ├── Leaves.jsx
│   │   │   ├── Payroll.jsx
│   │   │   ├── Reports.jsx
│   │   │   └── Profile.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── utils/
│   │   │   └── api.js
│   │   └── App.jsx
│   └── package.json
├── README.md
├── SETUP.md
└── PROJECT_SUMMARY.md
```

## Default Admin Credentials

- **Email**: admin@workzen.com
- **Password**: admin123

**Important**: Change this password after first login in production!

## Getting Started

1. Follow the setup instructions in `SETUP.md`
2. Create the database and run migrations
3. Seed the database with admin user
4. Start backend and frontend servers
5. Login with admin credentials
6. Create users for other roles
7. Start using the system!

## Future Enhancements

- Email notifications for leave approvals
- Password reset functionality
- Advanced filtering and search
- Bulk operations
- Export all data
- Mobile responsive improvements
- Real-time notifications
- Calendar integration
- Document upload
- Performance optimization for large datasets

## Notes

- The system is designed for small to medium-sized organizations
- For large-scale deployments, consider adding caching, pagination, and performance optimizations
- All sensitive data should be encrypted in production
- Regular backups of the database are recommended
- Monitor JWT token expiration and refresh mechanisms


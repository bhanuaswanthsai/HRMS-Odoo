# WorkZen HRMS - Project Presentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Database Schema & Design](#database-schema--design)
4. [Features Implemented](#features-implemented)
5. [API Architecture](#api-architecture)
6. [Frontend Implementation](#frontend-implementation)
7. [Security Features](#security-features)
8. [Project Structure](#project-structure)

---

## 🎯 Project Overview

**WorkZen HRMS** is a comprehensive Human Resource Management System designed to streamline HR operations, manage employee data, track attendance, handle leave requests, process payroll, and generate reports.

### Key Objectives
- Centralized employee management
- Automated attendance tracking
- Leave management with approval workflow
- Automated payroll calculation
- Role-based access control
- Comprehensive reporting system

---

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Relational database
- **JWT** - Authentication & authorization
- **bcryptjs** - Password hashing
- **PDFKit** - PDF report generation
- **ExcelJS** - Excel report generation

### Frontend
- **React** - UI library
- **Tailwind CSS** - Styling framework
- **Recharts** - Data visualization
- **React Router** - Navigation
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

---

## 🗄️ Database Schema & Design

### Database: `Hrms1`

The database consists of **5 main tables** with well-defined relationships, constraints, and indexes for optimal performance.

---

### 1. **Users Table** (Core Entity)

**Purpose**: Stores all user accounts including admins, HR officers, payroll officers, and employees.

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    hr_assigned_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    department VARCHAR(255),
    base_salary NUMERIC(10, 2) DEFAULT 0,
    status user_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Key Features:
- **Self-Referencing Foreign Key**: `hr_assigned_id` references `users(id)` - This creates a hierarchical relationship where employees can be assigned to HR officers
- **ENUM Types**: Uses `user_role` and `user_status` for data integrity
- **Automatic Timestamps**: `created_at` and `updated_at` are automatically managed
- **Unique Constraint**: Email must be unique across all users

#### Relationships:
- **Self-Reference**: `hr_assigned_id → users.id` (Many-to-One)
  - An employee can have one HR officer
  - An HR officer can have many employees
  - When HR officer is deleted, `hr_assigned_id` is set to NULL (ON DELETE SET NULL)

#### Indexes:
- `idx_users_email` - Fast email lookups for login
- `idx_users_role` - Quick role-based queries
- `idx_users_hr_assigned` - Efficient employee-HR relationships

---

### 2. **Attendance Table**

**Purpose**: Tracks daily attendance records for employees.

```sql
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status attendance_status NOT NULL DEFAULT 'absent',
    check_in_time TIME,
    check_out_time TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);
```

#### Key Features:
- **Foreign Key**: `user_id → users.id` with CASCADE delete
- **Unique Constraint**: `(user_id, date)` - Prevents duplicate attendance for same day
- **ENUM Type**: `attendance_status` ('present', 'absent', 'leave')
- **Time Tracking**: Separate fields for check-in and check-out times

#### Relationships:
- **Many-to-One**: `user_id → users.id`
  - One employee can have many attendance records
  - Each attendance record belongs to one employee
  - CASCADE delete: If employee is deleted, all their attendance records are deleted

#### Business Logic:
- Employees can mark attendance **once per day**
- HR/Admin can override incorrect entries
- Used by payroll system for salary calculations

#### Indexes:
- `idx_attendance_user_date` - Fast queries for employee attendance history

---

### 3. **Leaves Table**

**Purpose**: Manages employee leave applications and approvals.

```sql
CREATE TABLE leaves (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    leave_type VARCHAR(100) NOT NULL,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status leave_status DEFAULT 'pending',
    paid_status paid_status DEFAULT 'unpaid',
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Key Features:
- **Dual Foreign Keys**:
  - `user_id → users.id` (CASCADE) - The employee applying for leave
  - `approved_by → users.id` (SET NULL) - The HR/Admin who approved/rejected
- **ENUM Types**: `leave_status` ('pending', 'approved', 'rejected') and `paid_status` ('paid', 'unpaid')
- **Date Range**: Tracks leave period with `from_date` and `to_date`

#### Relationships:
- **Many-to-One (Employee)**: `user_id → users.id`
  - One employee can have many leave applications
  - CASCADE delete: Employee deletion removes all their leaves
  
- **Many-to-One (Approver)**: `approved_by → users.id`
  - One HR/Admin can approve many leaves
  - SET NULL: If approver is deleted, approval record remains but approver reference is cleared

#### Business Logic:
- Employee applies → Status: 'pending'
- HR/Admin approves → Status: 'approved', `approved_by` set, `paid_status` set
- HR/Admin rejects → Status: 'rejected', `approved_by` set
- Payroll uses `paid_status` for salary calculations

#### Indexes:
- `idx_leaves_user` - Fast employee leave history
- `idx_leaves_status` - Quick pending leaves queries

---

### 4. **Payroll Table**

**Purpose**: Stores calculated payroll data for each employee per month.

```sql
CREATE TABLE payroll (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    basic_salary NUMERIC(10, 2) NOT NULL,
    paid_leaves INTEGER DEFAULT 0,
    unpaid_leaves INTEGER DEFAULT 0,
    pf_deduction NUMERIC(10, 2) DEFAULT 0,
    professional_tax NUMERIC(10, 2) DEFAULT 0,
    net_salary NUMERIC(10, 2) NOT NULL,
    generated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, month, year)
);
```

#### Key Features:
- **Foreign Keys**:
  - `user_id → users.id` (CASCADE) - The employee
  - `generated_by → users.id` (SET NULL) - Payroll officer/admin who generated
- **Unique Constraint**: `(user_id, month, year)` - One payroll record per employee per month
- **Check Constraint**: Month must be between 1-12
- **Calculated Fields**: Stores all salary components

#### Relationships:
- **Many-to-One (Employee)**: `user_id → users.id`
  - One employee can have many payroll records (one per month)
  - CASCADE delete: Employee deletion removes all payroll records
  
- **Many-to-One (Generator)**: `generated_by → users.id`
  - One payroll officer can generate many payrolls
  - SET NULL: If generator is deleted, payroll record remains

#### Payroll Calculation Formula:
```
daily_salary = basic_salary / 30
unpaid_leave_deduction = unpaid_leaves * daily_salary
pf_deduction = basic_salary * 0.12 (12%)
professional_tax = 200 (fixed)
net_salary = basic_salary - unpaid_leave_deduction - pf_deduction - professional_tax
```

#### Indexes:
- `idx_payroll_user_month_year` - Fast payroll lookups
- `idx_payroll_month_year` - Monthly/yearly reports

---

### 5. **Reports Table** (Optional Caching)

**Purpose**: Caches generated report data for faster retrieval.

```sql
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_month INTEGER,
    report_year INTEGER,
    total_salary NUMERIC(10, 2),
    total_deductions NUMERIC(10, 2),
    pf NUMERIC(10, 2),
    tax NUMERIC(10, 2),
    unpaid_days INTEGER,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Key Features:
- **Foreign Key**: `employee_id → users.id` (CASCADE)
- **Caching Layer**: Stores aggregated data for quick report generation
- **Optional**: Can be populated for performance optimization

#### Relationships:
- **Many-to-One**: `employee_id → users.id`
  - One employee can have many report records
  - CASCADE delete: Employee deletion removes cached reports

---

## 🔗 Database Relationships Diagram

```
┌─────────────────┐
│     USERS       │
│─────────────────│
│ id (PK)         │◄─────┐
│ name            │      │
│ email (UNIQUE)  │      │
│ password_hash   │      │
│ role (ENUM)     │      │
│ hr_assigned_id  │──────┘ (Self-reference)
│ department      │
│ base_salary     │
│ status (ENUM)   │
│ created_at      │
│ updated_at      │
└─────────────────┘
       │
       │ 1:N
       │
       ├──────────────────┬──────────────────┬──────────────────┐
       │                  │                  │                  │
       ▼                  ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ ATTENDANCE   │  │    LEAVES    │  │   PAYROLL    │  │   REPORTS    │
│──────────────│  │──────────────│  │──────────────│  │──────────────│
│ id (PK)      │  │ id (PK)      │  │ id (PK)      │  │ id (PK)      │
│ user_id (FK) │  │ user_id (FK) │  │ user_id (FK) │  │ employee_id  │
│ date         │  │ from_date    │  │ month        │  │ (FK)         │
│ status       │  │ to_date      │  │ year         │  │ report_month │
│ check_in     │  │ leave_type   │  │ basic_salary │  │ report_year  │
│ check_out    │  │ approved_by  │  │ paid_leaves  │  │ total_salary │
│              │  │ (FK)         │  │ unpaid_leaves│  │ deductions   │
│              │  │ status       │  │ pf_deduction │  │              │
│              │  │ paid_status  │  │ tax          │  │              │
│              │  │ reason       │  │ net_salary   │  │              │
│              │  │              │  │ generated_by │  │              │
│              │  │              │  │ (FK)         │  │              │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

### Relationship Summary:

1. **Users → Attendance**: One-to-Many (CASCADE)
2. **Users → Leaves**: One-to-Many (CASCADE)
3. **Users → Payroll**: One-to-Many (CASCADE)
4. **Users → Reports**: One-to-Many (CASCADE)
5. **Users → Users**: Self-Reference (SET NULL) - HR assignment
6. **Users → Leaves**: One-to-Many (SET NULL) - Approval relationship
7. **Users → Payroll**: One-to-Many (SET NULL) - Generation relationship

---

## 📊 ENUM Types

### 1. `user_role`
```sql
CREATE TYPE user_role AS ENUM ('admin', 'hr', 'payroll', 'employee');
```
- **admin**: Full system access
- **hr**: Manage assigned employees, approve leaves
- **payroll**: Generate payroll, view reports
- **employee**: Mark attendance, apply leaves, view own data

### 2. `attendance_status`
```sql
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'leave');
```

### 3. `leave_status`
```sql
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
```

### 4. `paid_status`
```sql
CREATE TYPE paid_status AS ENUM ('paid', 'unpaid');
```

### 5. `user_status`
```sql
CREATE TYPE user_status AS ENUM ('active', 'inactive');
```

---

## 🔄 Database Triggers & Functions

### Auto-Update Timestamp Function
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';
```

### Triggers
- **users table**: Automatically updates `updated_at` on any UPDATE
- **leaves table**: Automatically updates `updated_at` on any UPDATE

---

## ✅ Features Implemented

### 1. **Authentication & Authorization**
- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Role-based access control (RBAC)
- ✅ Protected routes middleware
- ✅ Session management

### 2. **User Management**
- ✅ Create users (Admin only)
- ✅ Edit user details (Admin/HR)
- ✅ Delete users (Admin only)
- ✅ Search users by name/email
- ✅ Assign HR officers to employees
- ✅ User status management (active/inactive)

### 3. **Attendance Management**
- ✅ Employees mark daily attendance
- ✅ View attendance history
- ✅ HR/Admin can edit attendance
- ✅ Attendance summary reports
- ✅ One attendance record per day constraint

### 4. **Leave Management**
- ✅ Employees apply for leaves
- ✅ HR/Admin approve/reject leaves
- ✅ Paid/Unpaid leave classification
- ✅ Leave history tracking
- ✅ Pending leaves dashboard

### 5. **Payroll Management**
- ✅ Automated payroll generation
- ✅ Salary calculation with deductions
- ✅ PF deduction (12%)
- ✅ Professional tax calculation
- ✅ Unpaid leave deductions
- ✅ Payslip generation
- ✅ Monthly payroll reports

### 6. **Reports & Analytics**
- ✅ Employee search and reports
- ✅ PDF report generation
- ✅ Excel report export
- ✅ Attendance statistics
- ✅ Leave statistics
- ✅ Payroll summaries

### 7. **Dashboards**
- ✅ Admin Dashboard
  - Total employees count
  - Monthly/yearly payroll costs
  - Department-wise employee distribution
  - Payroll trend charts
  
- ✅ HR Dashboard
  - Team size
  - Pending leaves
  - Attendance rate
  - Department breakdown
  
- ✅ Payroll Dashboard
  - Monthly expenses
  - Yearly expenses
  - Department-wise salary breakdown
  - Salary trend charts
  
- ✅ Employee Dashboard
  - Personal attendance graph
  - Leave summary
  - Latest payslips

---

## 🔌 API Architecture

### Base URL: `http://localhost:5000/api`

### Authentication Routes (`/api/auth`)
- `POST /register` - Register new user (Admin only)
- `POST /login` - User login
- `GET /profile` - Get current user profile
- `PUT /change-password` - Change password

### User Routes (`/api/users`)
- `GET /` - Get all users (Admin only)
- `GET /:id` - Get user by ID (HR/Admin)
- `POST /` - Create user (Admin only)
- `PUT /:id` - Update user (HR/Admin)
- `DELETE /:id` - Delete user (Admin only)
- `GET /list/hr` - Get HR officers list (Admin)
- `GET /assigned/mine` - Get assigned employees (HR)

### Attendance Routes (`/api/attendance`)
- `POST /mark` - Mark attendance (Employee)
- `GET /:user_id` - Get attendance (Employee: own, HR/Admin: any)
- `GET /summary/all` - Get attendance summary (HR/Admin)
- `PUT /:id` - Update attendance (HR/Admin)

### Leave Routes (`/api/leave`)
- `POST /apply` - Apply for leave (Employee)
- `GET /my` - Get my leaves (Employee)
- `GET /pending` - Get pending leaves (HR/Admin)
- `GET /all` - Get all leaves (HR/Admin)
- `PUT /:id/approve` - Approve leave (HR/Admin)
- `PUT /:id/reject` - Reject leave (HR/Admin)
- `GET /types/list` - Get leave types

### Payroll Routes (`/api/payroll`)
- `POST /generate` - Generate payroll (Payroll/Admin)
- `GET /:user_id` - Get payroll (Employee: own, Payroll/Admin: any)
- `GET /reports/all` - Get all payroll reports (Payroll/Admin)
- `GET /summary/dashboard` - Get payroll summary (Payroll/Admin)

### Reports Routes (`/api/reports`)
- `GET /search` - Search employee reports (Admin/Payroll)
- `GET /download/:employee_id/pdf` - Download PDF report
- `GET /download/:employee_id/excel` - Download Excel report

---

## 🎨 Frontend Implementation

### Pages Implemented
1. **Login Page** - User authentication
2. **Dashboard** - Role-based dashboards with charts
3. **User Management** - CRUD operations for users
4. **Attendance** - Mark and view attendance
5. **Leaves** - Apply and manage leaves
6. **Payroll** - Generate and view payroll
7. **Reports** - Search and export reports
8. **Profile** - View and edit profile

### Components
- **Navbar** - Navigation with role-based menu
- **ProtectedRoute** - Route protection based on roles
- **Charts** - Recharts integration for analytics

### State Management
- **AuthContext** - Global authentication state
- **React Hooks** - Local component state

---

## 🔒 Security Features

1. **Password Security**
   - Bcrypt hashing (10 rounds)
   - Passwords never stored in plain text

2. **Authentication**
   - JWT tokens with expiration
   - Token stored in localStorage
   - Automatic token refresh

3. **Authorization**
   - Role-based middleware
   - Route-level protection
   - API endpoint protection

4. **Data Validation**
   - Input validation on frontend
   - Server-side validation
   - SQL injection prevention (parameterized queries)

5. **CORS Configuration**
   - Configured for frontend origin
   - Secure API access

---

## 📁 Project Structure

```
workzen-hrms/
├── backend/
│   ├── config/
│   │   ├── database.js          # Database connection
│   │   ├── database.sql         # Schema definition
│   │   ├── init-database.js     # Database initialization
│   │   └── seed.js              # Seed admin user
│   ├── middleware/
│   │   └── auth.js              # JWT & role middleware
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── users.js             # User management routes
│   │   ├── attendance.js        # Attendance routes
│   │   ├── leave.js             # Leave management routes
│   │   ├── payroll.js           # Payroll routes
│   │   └── reports.js           # Reports routes
│   ├── server.js                # Express server
│   └── package.json
│
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
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- PostgreSQL (v12+)
- npm or yarn

### Setup Steps
1. Clone the repository
2. Install dependencies: `npm install` (root, backend, frontend)
3. Configure database in `backend/.env`
4. Initialize database: `node backend/config/init-database.js`
5. Seed admin user: `node backend/config/seed.js`
6. Start backend: `cd backend && npm run dev`
7. Start frontend: `cd frontend && npm run dev`

### Default Admin Credentials
- **Email**: admin@workzen.com
- **Password**: admin123

---

## 📈 Future Enhancements

- [ ] Email notifications for leave approvals
- [ ] Password reset functionality
- [ ] Advanced filtering and search
- [ ] Bulk operations
- [ ] Real-time notifications
- [ ] Calendar integration
- [ ] Document upload
- [ ] Performance optimizations for large datasets
- [ ] Mobile responsive improvements
- [ ] Multi-language support

---

## 📝 Conclusion

WorkZen HRMS is a fully functional HR management system with:
- ✅ Complete database schema with proper relationships
- ✅ Secure authentication and authorization
- ✅ Role-based access control
- ✅ Automated payroll calculations
- ✅ Comprehensive reporting system
- ✅ Modern, responsive UI
- ✅ RESTful API architecture

The system is production-ready and can be extended with additional features as needed.

---

**Developed with ❤️ using Node.js, React, and PostgreSQL**


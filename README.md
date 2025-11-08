# WorkZen HRMS

A comprehensive Human Resource Management System built with React, Node.js, Express, and PostgreSQL.

## Features

- **Role-Based Access Control**: Admin, HR Officer, Payroll Officer, and Employee roles
- **User Management**: Create, update, and manage users with HR assignments
- **Attendance Tracking**: Mark attendance, view logs, and generate summaries
- **Leave Management**: Apply for leaves, approve/reject with paid/unpaid status
- **Payroll Management**: Generate payroll with automatic calculations (PF, Tax, Deductions)
- **Reports & Analytics**: Generate PDF/Excel reports with employee statistics
- **Dashboard Analytics**: Visual charts for payroll, attendance, and department-wise data

## Tech Stack

### Backend
- Node.js + Express
- PostgreSQL
- JWT Authentication
- bcryptjs for password hashing
- PDFKit for PDF generation
- ExcelJS for Excel export

### Frontend
- React
- Tailwind CSS
- Recharts for data visualization
- Axios for API calls

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/Hrms1
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
```

   **Note**: You can also use individual connection parameters:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=Hrms1
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

4. Create the database (if not already created):
```sql
CREATE DATABASE Hrms1;
```

5. Run the database schema:
```bash
psql -U postgres -d Hrms1 -f config/database.sql
```

6. Seed the database with default admin user:
```bash
node config/seed.js
```

7. Start the server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### Default Admin Credentials

- **Email**: admin@workzen.com
- **Password**: admin123

**Important**: Change the default admin password after first login!

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (Admin only)
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/change-password` - Change password

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID (HR/Admin)
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/:id` - Update user (HR/Admin)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Attendance
- `POST /api/attendance/mark` - Mark attendance (Employee)
- `GET /api/attendance/:user_id` - Get attendance (Employee: own, HR/Admin: any)
- `GET /api/attendance/summary/all` - Get attendance summary (HR/Admin)
- `PUT /api/attendance/:id` - Update attendance (HR/Admin)

### Leaves
- `POST /api/leave/apply` - Apply for leave (Employee)
- `GET /api/leave/my` - Get my leaves (Employee)
- `GET /api/leave/pending` - Get pending leaves (HR/Admin)
- `GET /api/leave/all` - Get all leaves (HR/Admin)
- `PUT /api/leave/:id/approve` - Approve leave (HR/Admin)
- `PUT /api/leave/:id/reject` - Reject leave (HR/Admin)

### Payroll
- `POST /api/payroll/generate` - Generate payroll (Payroll/Admin)
- `GET /api/payroll/:user_id` - Get payroll (Employee: own, Payroll/Admin: any)
- `GET /api/payroll/reports/all` - Get all payroll reports (Payroll/Admin)
- `GET /api/payroll/summary/dashboard` - Get payroll summary (Payroll/Admin)

### Reports
- `GET /api/reports/search` - Search employee reports (Admin/Payroll)
- `GET /api/reports/download/:employee_id/pdf` - Download PDF report
- `GET /api/reports/download/:employee_id/excel` - Download Excel report

## Project Structure

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
│   │   ├── pages/
│   │   ├── context/
│   │   ├── utils/
│   │   └── App.jsx
│   └── package.json
└── README.md
```

## License

ISC


# WorkZen HRMS Setup Guide

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Step 1: Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE workzen_hrms;
```

2. Update the database credentials in `backend/.env`:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/Hrms1
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
```

   **Note**: For the provided database URL:
   ```env
   DATABASE_URL=postgresql://postgres:Bhanu%40559@localhost:5432/Hrms1
   ```
   (The %40 is URL-encoded @ symbol)

3. Run the database schema:
```bash
cd backend
psql -U postgres -d Hrms1 -f config/database.sql
```

4. Seed the database with default admin user:
```bash
node config/seed.js
```

## Step 2: Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/Hrms1
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
```

4. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

## Step 3: Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the frontend development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Step 4: Access the Application

1. Open your browser and navigate to `http://localhost:5173`

2. Login with default admin credentials:
   - **Email**: admin@workzen.com
   - **Password**: admin123

3. **Important**: Change the admin password after first login!

## Default Admin Credentials

- **Email**: admin@workzen.com
- **Password**: admin123

## Features

### Admin Role
- Create and manage users
- View all employees
- Generate payroll
- View reports and analytics
- Full system access

### HR Officer Role
- View assigned employees
- Approve/reject leave requests
- View attendance of assigned employees
- Manage employee information

### Payroll Officer Role
- Generate payroll
- View payroll reports
- Download payslips
- View analytics

### Employee Role
- Mark attendance
- Apply for leaves
- View own payslips
- View own attendance and leave history

## Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists

### Port Already in Use
- Change PORT in backend `.env`
- Change port in frontend `vite.config.js`

### JWT Token Error
- Clear browser localStorage
- Login again
- Check JWT_SECRET in backend `.env`

## Development

### Running Both Servers
From the root directory:
```bash
npm run dev
```

This will start both backend and frontend servers concurrently.

### Database Migrations
To update the database schema, modify `backend/config/database.sql` and run it again.

### Adding New Features
1. Backend: Add routes in `backend/routes/`
2. Frontend: Add pages in `frontend/src/pages/`
3. Update navigation in `frontend/src/components/Navbar.jsx`

## Production Deployment

1. Build frontend:
```bash
cd frontend
npm run build
```

2. Set environment variables in production
3. Use a process manager like PM2 for Node.js
4. Configure reverse proxy (nginx) for frontend
5. Use SSL certificates for HTTPS

## Support

For issues or questions, please refer to the README.md file or contact the development team.


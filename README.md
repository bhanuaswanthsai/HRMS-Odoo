# HRMS - Human Resource Management System

A comprehensive Human Resource Management System built with modern web technologies.

## Project Structure

```
HRMS/
├── Frontend/          # React + JavaScript + Tailwind CSS
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service functions
│   │   ├── utils/         # Utility functions
│   │   └── context/       # React Context for state management
│   └── package.json
│
├── Backend/           # Node.js + Express + JavaScript
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Custom middleware
│   │   └── config/        # Configuration files
│   ├── database/          # Database schema and migrations
│   └── package.json
│
└── README.md
```

## Technical Stack

### Frontend
- **Framework**: React.js 18 with JavaScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form
- **State Management**: React Context API

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js with JavaScript
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS
- **Validation**: Express Validator
- **Logging**: Morgan

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v12 or higher)
- **Git**

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd HRMS
```

### 2. Database Setup

**IMPORTANT**: You must set up the database before starting the server!

#### Option 1: Automated Setup (Recommended)

1. **Create the database** (if not exists):
   ```sql
   CREATE DATABASE hrms;
   ```

2. **Configure `.env` file** in `Backend` directory with database credentials

3. **Run the setup script**:
   ```bash
   cd Backend
   npm run db:setup
   ```

   This will automatically:
   - Create all database tables
   - Create settings tables  
   - Insert the default admin user

#### Option 2: Manual Setup

1. **Create a PostgreSQL database**:
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

4. **Load the default admin user**:
   ```bash
   psql -U postgres -d hrms -f seed.sql
   ```

#### Default Admin Account

After setup, you can login with:
- **Email**: `admin@hrms.com`
- **Password**: `admin123`
- **Role**: `admin`

⚠️ **Change this password immediately after first login!**

#### Troubleshooting

If you see error: **"relation 'users' does not exist"**
- The database tables haven't been created yet
- Run the setup script: `npm run db:setup` in the Backend directory
- Or manually run the SQL files as shown in Option 2

### 3. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd Backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `Backend` directory:
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

4. Start the development server:
   ```bash
   npm run dev
   ```

   The backend server will run on `http://localhost:5000`

### 4. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd Frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:3000`

## Database Schema

The database consists of the following main tables:

- **users** - User authentication and basic information
- **employees** - Employee-specific details
- **attendance** - Daily attendance records
- **leaves** - Leave requests and approvals
- **payroll** - Monthly payroll information
- **payslips** - Generated payslip documents
- **leave_balance** - Available leave balances

See `Backend/database/schema.sql` for the complete schema definition.

## Available Scripts

### Backend

- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Development Workflow

1. Start PostgreSQL database
2. Start the backend server (`cd Backend && npm run dev`)
3. Start the frontend server (`cd Frontend && npm run dev`)
4. Access the application at `http://localhost:3000`

## Default Admin Account

After running the seed file, you can login with:

- **Email**: `admin@hrms.com`
- **Password**: `admin123`

⚠️ **Important**: Change this password immediately after first login!

## Getting Started

1. **Login as Admin**: Use the default admin credentials above
2. **Add Users**: Navigate to "Manage Users" from the dashboard
3. **Assign Roles**: Create users with appropriate roles:
   - **Admin**: Full system access
   - **HR Officer**: Employee and leave management
   - **Payroll Officer**: Payroll processing and reports
   - **Employee**: View own data, apply for leaves

## Implementation Status

✅ **Phase 1**: Project Setup & Architecture
✅ **Phase 2**: Core Module Development (Auth, Employees, Attendance, Leaves, Payroll, Dashboard)
✅ **Phase 3**: Role-Based Access Control
✅ **Phase 4**: Advanced Features (Reports, Settings, Notifications)
✅ **Phase 5**: Testing (Unit, Integration, Role-Based, Edge Cases)
✅ **User Management**: Admin can create and manage all users

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

ISC


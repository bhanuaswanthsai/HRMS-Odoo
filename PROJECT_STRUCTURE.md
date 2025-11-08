# HRMS Project Structure

## Complete Folder Structure

```
HRMS/
├── .gitignore                          # Git ignore rules
├── README.md                           # Main project documentation
├── PROJECT_STRUCTURE.md                # This file
│
├── Frontend/                           # React Frontend Application
│   ├── .eslintrc.cjs                   # ESLint configuration
│   ├── .gitignore                      # Frontend-specific gitignore
│   ├── index.html                      # HTML entry point
│   ├── package.json                    # Frontend dependencies
│   ├── postcss.config.js               # PostCSS configuration
│   ├── tailwind.config.js              # Tailwind CSS configuration
│   ├── vite.config.js                 # Vite build configuration
│   │
│   └── src/                            # Source code
│       ├── App.jsx                     # Main App component
│       ├── main.jsx                    # Application entry point
│       ├── index.css                   # Global styles with Tailwind
│       ├── components/                 # Reusable UI components
│       ├── pages/                      # Page components
│       ├── services/                   # API service functions
│       ├── utils/                      # Utility functions
│       └── context/                    # React Context for state
│
├── Backend/                            # Node.js Backend API
│   ├── .eslintrc.json                  # ESLint configuration
│   ├── .gitignore                      # Backend-specific gitignore
│   ├── package.json                    # Backend dependencies
│   │
│   ├── database/                       # Database files
│   │   ├── README.md                   # Database setup guide
│   │   ├── schema.sql                  # Database schema
│   │   └── seed.sql                    # Sample seed data
│   │
│   └── src/                            # Source code
│       ├── server.js                   # Express server entry point
│       ├── config/                     # Configuration files
│       │   └── database.js             # PostgreSQL connection
│       ├── controllers/                # Request handlers
│       ├── models/                     # Database models
│       ├── routes/                     # API route definitions
│       └── middleware/                 # Custom middleware
```

## Technology Stack Summary

### Frontend
- **React 18** with JavaScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for HTTP requests
- **React Hook Form** for form handling
- **Context API** for state management

### Backend
- **Node.js** with Express
- **JavaScript** (ES6+ modules)
- **PostgreSQL** database
- **JWT** for authentication
- **Helmet** for security headers
- **CORS** for cross-origin requests
- **Express Validator** for input validation
- **Morgan** for HTTP logging

## Database Schema

### Tables
1. **users** - User authentication and profiles
2. **employees** - Employee information
3. **attendance** - Daily attendance records
4. **leaves** - Leave requests
5. **payroll** - Monthly payroll data
6. **payslips** - Generated payslip documents
7. **leave_balance** - Employee leave balances

## Next Steps

1. Install dependencies:
   - `cd Frontend && npm install`
   - `cd Backend && npm install`

2. Set up database:
   - Create PostgreSQL database
   - Run `Backend/database/schema.sql`

3. Configure environment:
   - Copy `.env.example` to `.env` in Backend
   - Update database credentials

4. Start development:
   - Backend: `cd Backend && npm run dev`
   - Frontend: `cd Frontend && npm run dev`

## Phase 1 Completion Checklist

✅ Project structure created
✅ Frontend configuration complete (JavaScript)
✅ Backend configuration complete (JavaScript)
✅ Database schema designed (PostgreSQL)
✅ ESLint configuration
✅ Build tools configured
✅ Documentation created


# Troubleshooting Company Registration

## Common Issues and Solutions

### 1. Error: "Error registering company"

**Possible Causes:**
- Database connection issue
- Missing required fields
- Duplicate email/login_id
- SQL constraint violation
- Server not running

**Solution:**
1. Check server logs in the terminal where `npm run dev` is running
2. Check browser console for detailed error messages
3. Verify all required fields are filled:
   - Company Name
   - Company Email
   - Admin First Name (min 2 characters)
   - Admin Last Name (min 2 characters)
   - Admin Email
   - Admin Password (min 6 characters)

### 2. Error: "Company with this email already exists"

**Solution:**
- Use a different company email address
- The email must be unique across all companies

### 3. Error: "Admin email already exists"

**Solution:**
- Use a different admin email address
- The admin email must be unique

### 4. Error: "First name and last name must be at least 2 characters long"

**Solution:**
- Ensure both first name and last name have at least 2 characters
- This is required for Login ID generation

### 5. Database Errors

**Check:**
- PostgreSQL server is running: `brew services list | grep postgresql`
- Database connection: Check backend server logs
- Database schema: Run migration if needed

### 6. Server Not Running

**Solution:**
```bash
cd backend
npm run dev
```

### 7. Check Server Logs

The backend will log detailed error information. Look for:
- "Register company error:" in the console
- SQL error messages
- Validation errors

## Testing the Endpoint

You can test the registration endpoint directly:

```bash
curl -X POST http://localhost:5000/api/auth/register-company \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Test Company",
    "company_email": "test@company.com",
    "admin_first_name": "John",
    "admin_last_name": "Doe",
    "admin_email": "john@company.com",
    "admin_password": "test123"
  }'
```

## Verify Database

Check if the company was created:

```bash
psql -U postgres -d hrms -c "SELECT id, company_name, company_email, email, login_id FROM users WHERE role = 'admin' ORDER BY id DESC LIMIT 5;"
```

## Next Steps

1. Check backend server logs for detailed error messages
2. Verify all required fields are provided
3. Check database constraints
4. Ensure PostgreSQL is running
5. Verify network connectivity between frontend and backend


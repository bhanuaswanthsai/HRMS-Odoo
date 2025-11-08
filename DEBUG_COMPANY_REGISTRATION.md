# Debug Company Registration Issue

## Steps to Debug

### 1. Check Backend Server Logs

The backend now has detailed logging. When you try to register a company, you should see:

```
=== Company Registration Request ===
Request body: { ... }
All required fields present
Checking company email: ...
Checking admin email: ...
Email checks passed
Getting employee number for year: 2025
Employee number: X
Generated login ID: ...
Unique login ID found: ...
Hashing password...
Attempting to insert user with params: { ... }
User created successfully: { ... }
```

OR if there's an error:

```
=== REGISTER COMPANY ERROR ===
Error message: ...
Error code: ...
Error detail: ...
```

**Action**: Look at the terminal where `npm run dev` is running in the `backend` folder.

### 2. Check Browser Console

Open Developer Tools (F12) and check the Console tab. You should see:

```
=== FRONTEND COMPANY REGISTRATION ERROR ===
Error response: { ... }
Error data: { ... }
```

**Action**: Check what error is being logged in the browser console.

### 3. Test the Endpoint Directly

Run this command to test the endpoint:

```bash
cd backend
node ../test-company-registration.js
```

This will show you the exact error from the backend.

### 4. Common Issues and Solutions

#### Issue: "Error registering company" (Generic)
**Solution**: 
- Check backend server logs for the actual error
- Verify all required fields are filled
- Check if server is running: `cd backend && npm run dev`

#### Issue: "Email already exists"
**Solution**: 
- Use a different company email
- Use a different admin email

#### Issue: "First name and last name must be at least 2 characters long"
**Solution**: 
- Ensure both names have at least 2 characters

#### Issue: Database connection error
**Solution**: 
- Check if PostgreSQL is running: `brew services list | grep postgresql`
- Verify database connection in backend/.env

#### Issue: CORS error
**Solution**: 
- Check if backend server is running on port 5000
- Verify frontend is calling the correct API URL

### 5. Verify Server is Running

```bash
# Check if backend server is running
curl http://localhost:5000/api/health

# Should return: {"status":"OK","message":"WorkZen HRMS API is running"}
```

### 6. Check Database

```bash
# Verify database connection
psql -U postgres -d hrms -c "SELECT COUNT(*) FROM users;"

# Check existing companies
psql -U postgres -d hrms -c "SELECT company_name, company_email, email FROM users WHERE role = 'admin';"
```

### 7. Most Likely Issues

1. **Server not running**: Start backend server
2. **Database connection**: Check PostgreSQL is running
3. **Duplicate email**: Use unique emails
4. **Missing fields**: Fill all required fields
5. **Network issue**: Check API URL in frontend

## Next Steps

1. **Try registering again** and check:
   - Backend terminal logs
   - Browser console logs
   
2. **Share the error messages** you see in:
   - Backend terminal (look for "=== REGISTER COMPANY ERROR ===")
   - Browser console (look for "=== FRONTEND COMPANY REGISTRATION ERROR ===")

3. **Check if server is running**:
   ```bash
   cd backend
   npm run dev
   ```

The detailed logs will tell us exactly what's going wrong!


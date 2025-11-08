# Quick Start Guide - WorkZen HRMS

## Your Database Configuration

Your PostgreSQL database URL has been configured:
```
DATABASE_URL=postgresql://postgres:Bhanu%40559@localhost:5432/Hrms1
```

## Step 1: Setup Database Schema

1. Make sure PostgreSQL is running
2. The database `Hrms1` should already exist
3. Run the schema script:

```bash
cd backend
psql -U postgres -d Hrms1 -f config/database.sql
```

## Step 2: Setup Backend

1. Navigate to backend:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. The `.env` file should already be configured with your DATABASE_URL. If not, create it:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:Bhanu%40559@localhost:5432/Hrms1
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
```

4. Seed the database with admin user:
```bash
node config/seed.js
```

5. Start the backend server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

## Step 3: Setup Frontend

1. Open a new terminal and navigate to frontend:
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

4. Start the frontend:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## Step 4: Login

1. Open browser: `http://localhost:5173`
2. Login with:
   - **Email**: admin@workzen.com
   - **Password**: admin123

## Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running
- Check if database `Hrms1` exists
- Verify the password in DATABASE_URL is correct (Bhanu@559, URL-encoded as Bhanu%40559)

### Port Already in Use
- Backend: Change PORT in `.env`
- Frontend: Change port in `vite.config.js`

### Schema Already Exists
If you get errors about tables already existing, you can:
1. Drop and recreate the database, OR
2. Comment out the CREATE TYPE and CREATE TABLE statements in `database.sql` and only run the INSERT statements

### Reset Admin User
If you need to reset the admin user:
```sql
DELETE FROM users WHERE email = 'admin@workzen.com';
```
Then run: `node config/seed.js`

## Next Steps

1. Login as admin
2. Create HR Officer users
3. Create Employee users and assign them to HR Officers
4. Start using the system!

For detailed documentation, see `README.md` and `SETUP.md`


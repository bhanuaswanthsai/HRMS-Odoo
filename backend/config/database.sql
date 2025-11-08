-- WorkZen HRMS Database Schema
-- Database: Hrms1

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('admin', 'hr', 'payroll', 'employee');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'leave');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE paid_status AS ENUM ('paid', 'unpaid');
CREATE TYPE user_status AS ENUM ('active', 'inactive');

-- Users table
CREATE TABLE IF NOT EXISTS users (
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

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status attendance_status NOT NULL DEFAULT 'absent',
    check_in_time TIME,
    check_out_time TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- Leaves table
CREATE TABLE IF NOT EXISTS leaves (
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

-- Payroll table
CREATE TABLE IF NOT EXISTS payroll (
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

-- Reports table (optional caching)
CREATE TABLE IF NOT EXISTS reports (
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_hr_assigned ON users(hr_assigned_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX IF NOT EXISTS idx_leaves_user ON leaves(user_id);
CREATE INDEX IF NOT EXISTS idx_leaves_status ON leaves(status);
CREATE INDEX IF NOT EXISTS idx_payroll_user_month_year ON payroll(user_id, month, year);
CREATE INDEX IF NOT EXISTS idx_payroll_month_year ON payroll(month, year);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leaves_updated_at BEFORE UPDATE ON leaves
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (name, email, password_hash, role, department, base_salary, status)
VALUES (
    'Admin User',
    'admin@workzen.com',
    '$2a$10$rOzJ9vYzX5v5J5J5J5J5Je5J5J5J5J5J5J5J5J5J5J5J5J5J5J5J5J',
    'admin',
    'Administration',
    0,
    'active'
) ON CONFLICT (email) DO NOTHING;

-- Note: The default admin password hash above is a placeholder.
-- In production, use: bcrypt.hash('admin123', 10)
-- For now, run the seed script to create admin with proper hash


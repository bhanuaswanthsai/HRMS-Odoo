-- Migration: Add Profile Fields to users table
-- This adds all the fields shown in the Employee Profile schema

-- Add profile fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar TEXT,
ADD COLUMN IF NOT EXISTS job_position VARCHAR(255),
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS residing_address TEXT,
ADD COLUMN IF NOT EXISTS nationality VARCHAR(100),
ADD COLUMN IF NOT EXISTS personal_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
ADD COLUMN IF NOT EXISTS marital_status VARCHAR(20),
ADD COLUMN IF NOT EXISTS date_of_joining DATE,
ADD COLUMN IF NOT EXISTS about TEXT,
ADD COLUMN IF NOT EXISTS job_likes TEXT,
ADD COLUMN IF NOT EXISTS interests_hobbies TEXT,
ADD COLUMN IF NOT EXISTS resume TEXT,
ADD COLUMN IF NOT EXISTS skills TEXT[],
ADD COLUMN IF NOT EXISTS certifications TEXT[],
ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS pan_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS uan_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS emp_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS month_wage NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS yearly_wage NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS working_days_per_week INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS break_time_hours NUMERIC(4, 2),
ADD COLUMN IF NOT EXISTS basic_salary_percentage NUMERIC(5, 2) DEFAULT 50.00,
ADD COLUMN IF NOT EXISTS hra_percentage NUMERIC(5, 2) DEFAULT 50.00,
ADD COLUMN IF NOT EXISTS standard_allowance_percentage NUMERIC(5, 2) DEFAULT 16.67,
ADD COLUMN IF NOT EXISTS performance_bonus_percentage NUMERIC(5, 2) DEFAULT 8.33,
ADD COLUMN IF NOT EXISTS lta_percentage NUMERIC(5, 2) DEFAULT 8.33,
ADD COLUMN IF NOT EXISTS fixed_allowance_percentage NUMERIC(5, 2) DEFAULT 11.67,
ADD COLUMN IF NOT EXISTS pf_employee_percentage NUMERIC(5, 2) DEFAULT 12.00,
ADD COLUMN IF NOT EXISTS pf_employer_percentage NUMERIC(5, 2) DEFAULT 12.00,
ADD COLUMN IF NOT EXISTS professional_tax NUMERIC(10, 2) DEFAULT 200.00;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);
CREATE INDEX IF NOT EXISTS idx_users_personal_email ON users(personal_email);

-- Update date_of_joining for existing users if not set
UPDATE users 
SET date_of_joining = created_at::DATE 
WHERE date_of_joining IS NULL;

-- Set default date_of_joining for future inserts
ALTER TABLE users ALTER COLUMN date_of_joining SET DEFAULT CURRENT_DATE;


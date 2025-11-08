-- Migration: Add Login ID and related fields to users table
-- Run this script to update existing database schema

-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS login_id VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS password_changed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS year_of_joining INTEGER,
ADD COLUMN IF NOT EXISTS employee_number INTEGER,
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS company_logo TEXT;

-- Create index on login_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_login_id ON users(login_id);

-- Create index on employee_number
CREATE INDEX IF NOT EXISTS idx_users_employee_number ON users(employee_number);

-- Create sequence for employee numbers (if not exists)
CREATE SEQUENCE IF NOT EXISTS employee_number_seq START 1;

-- Update existing users: split name into first_name and last_name
UPDATE users 
SET first_name = SPLIT_PART(name, ' ', 1),
    last_name = CASE 
        WHEN POSITION(' ' IN name) > 0 THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
        ELSE ''
    END
WHERE first_name IS NULL OR last_name IS NULL;

-- For existing admin user, set password_changed to true (they've already logged in)
UPDATE users 
SET password_changed = true 
WHERE email = 'admin@workzen.com';

-- Set year_of_joining for existing users to current year if not set
UPDATE users 
SET year_of_joining = EXTRACT(YEAR FROM created_at)::INTEGER
WHERE year_of_joining IS NULL;

-- Generate login_id for existing users (temporary, can be regenerated)
-- Format: first 2 letters of first name + first 2 letters of last name + year + employee number
UPDATE users u
SET login_id = LOWER(
    SUBSTRING(COALESCE(first_name, 'user'), 1, 2) || 
    SUBSTRING(COALESCE(last_name, ''), 1, 2) || 
    COALESCE(year_of_joining::TEXT, EXTRACT(YEAR FROM created_at)::TEXT) || 
    LPAD(u.id::TEXT, 3, '0')
),
employee_number = u.id
WHERE login_id IS NULL;

-- Create a function to generate login_id
CREATE OR REPLACE FUNCTION generate_login_id(
    p_first_name VARCHAR,
    p_last_name VARCHAR,
    p_year INTEGER,
    p_employee_number INTEGER
) RETURNS VARCHAR AS $$
BEGIN
    RETURN LOWER(
        SUBSTRING(p_first_name, 1, 2) || 
        SUBSTRING(p_last_name, 1, 2) || 
        p_year::TEXT || 
        LPAD(p_employee_number::TEXT, 3, '0')
    );
END;
$$ LANGUAGE plpgsql;

-- Create a function to get next employee number for a given year
CREATE OR REPLACE FUNCTION get_next_employee_number(p_year INTEGER) RETURNS INTEGER AS $$
DECLARE
    v_next_number INTEGER;
BEGIN
    SELECT COALESCE(MAX(employee_number), 0) + 1
    INTO v_next_number
    FROM users
    WHERE year_of_joining = p_year;
    
    RETURN v_next_number;
END;
$$ LANGUAGE plpgsql;


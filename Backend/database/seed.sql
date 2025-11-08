-- Seed Data for HRMS Database
-- This file contains default admin user for initial setup

-- Insert default admin user
-- Email: admin@hrms.com
-- Password: admin123
-- IMPORTANT: Change this password after first login!
-- This is a bcrypt hash for 'admin123' with 10 salt rounds
INSERT INTO users (id, email, password, role, profile_data) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@hrms.com', '$2a$10$cgyvUFE6E3fs1wDKKRw4Pe0iDLayimRFdqXjClghODCg68Y/nmHEm', 'admin', '{"name": "System Administrator", "phone": "", "created_by": "system"}')
ON CONFLICT (email) DO NOTHING;

-- Note: After first login, admin should:
-- 1. Change the default password
-- 2. Add all other users (HR Officers, Payroll Officers, Employees)
-- 3. Assign appropriate roles to each user

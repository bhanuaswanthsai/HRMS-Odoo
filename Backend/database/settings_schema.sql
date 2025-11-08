-- Settings Table
-- Stores system configuration and settings
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates(name);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Triggers
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO settings (key, value, category, description) VALUES
('company_name', '"HRMS Company"', 'company', 'Company name'),
('company_logo', '""', 'company', 'Company logo URL'),
('leave_policy', '{"casual_leave": 12, "sick_leave": 10, "earned_leave": 15, "paid_leave": 5}', 'leave', 'Default leave policy'),
('salary_components', '{"basic": 0, "hra": 0, "conveyance": 0, "medical": 0}', 'payroll', 'Default salary components'),
('tax_config', '{"pf_percentage": 12, "professional_tax": 200}', 'payroll', 'Tax configuration')
ON CONFLICT (key) DO NOTHING;

-- Insert default email templates
INSERT INTO email_templates (name, subject, body, variables) VALUES
('leave_approved', 'Leave Approved', 'Dear {{employee_name}},\n\nYour leave request from {{start_date}} to {{end_date}} has been approved.\n\nThank you.', '["employee_name", "start_date", "end_date"]'),
('leave_rejected', 'Leave Rejected', 'Dear {{employee_name}},\n\nYour leave request from {{start_date}} to {{end_date}} has been rejected.\n\nReason: {{reason}}\n\nThank you.', '["employee_name", "start_date", "end_date", "reason"]'),
('payslip_generated', 'Payslip Generated', 'Dear {{employee_name}},\n\nYour payslip for {{month}}/{{year}} has been generated.\n\nThank you.', '["employee_name", "month", "year"]'),
('attendance_reminder', 'Attendance Reminder', 'Dear {{employee_name}},\n\nThis is a reminder to mark your attendance for today.\n\nThank you.', '["employee_name"]')
ON CONFLICT (name) DO NOTHING;


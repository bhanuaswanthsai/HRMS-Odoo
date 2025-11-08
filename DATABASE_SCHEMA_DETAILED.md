# WorkZen HRMS - Detailed Database Schema Documentation

## 📊 Complete Database Schema Overview

### Database: `Hrms1` (PostgreSQL)

---

## 🗂️ Table Structure & Relationships

### Entity Relationship Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                         USERS (Core Table)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Primary Key: id (SERIAL)                                 │  │
│  │ Unique: email                                            │  │
│  │ Self-Reference: hr_assigned_id → users.id                │  │
│  │                                                           │  │
│  │ Relationships:                                           │  │
│  │   • 1:N → Attendance (CASCADE)                           │  │
│  │   • 1:N → Leaves (CASCADE)                               │  │
│  │   • 1:N → Payroll (CASCADE)                              │  │
│  │   • 1:N → Reports (CASCADE)                              │  │
│  │   • 1:N → Leaves.approved_by (SET NULL)                  │  │
│  │   • 1:N → Payroll.generated_by (SET NULL)                │  │
│  │   • N:1 → users.hr_assigned_id (SET NULL)                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ ATTENDANCE   │      │    LEAVES    │      │   PAYROLL    │
│              │      │              │      │              │
│ user_id (FK) │      │ user_id (FK) │      │ user_id (FK) │
│              │      │ approved_by  │      │ generated_by │
│              │      │ (FK)         │      │ (FK)         │
└──────────────┘      └──────────────┘      └──────────────┘
```

---

## 📋 Detailed Table Specifications

### 1. USERS Table

**Purpose**: Central table storing all system users (Admin, HR, Payroll, Employees)

#### Schema:
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,                    -- Auto-incrementing unique ID
    name VARCHAR(255) NOT NULL,               -- User's full name
    email VARCHAR(255) UNIQUE NOT NULL,       -- Unique email (used for login)
    password_hash VARCHAR(255) NOT NULL,      -- Bcrypt hashed password
    role user_role NOT NULL DEFAULT 'employee', -- User role (ENUM)
    hr_assigned_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- Self-reference
    department VARCHAR(255),                  -- Department name
    base_salary NUMERIC(10, 2) DEFAULT 0,     -- Monthly base salary
    status user_status DEFAULT 'active',      -- Account status (ENUM)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Field Details:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing unique identifier |
| `name` | VARCHAR(255) | NOT NULL | User's full name |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Login email, must be unique |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hashed password (never plain text) |
| `role` | user_role (ENUM) | NOT NULL, DEFAULT 'employee' | User role: admin, hr, payroll, employee |
| `hr_assigned_id` | INTEGER | FK → users.id, SET NULL | Reference to HR officer (self-reference) |
| `department` | VARCHAR(255) | NULLABLE | Department name |
| `base_salary` | NUMERIC(10,2) | DEFAULT 0 | Monthly base salary in rupees |
| `status` | user_status (ENUM) | DEFAULT 'active' | Account status: active, inactive |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time (auto-updated) |

#### Relationships:

1. **Self-Reference (Hierarchical)**:
   ```
   users.hr_assigned_id → users.id
   ```
   - **Type**: Many-to-One (Self-Referencing)
   - **Cardinality**: Many employees → One HR officer
   - **Delete Behavior**: SET NULL (if HR is deleted, employees' hr_assigned_id becomes NULL)
   - **Purpose**: Assign employees to HR officers for management

2. **To Attendance**:
   ```
   attendance.user_id → users.id
   ```
   - **Type**: One-to-Many
   - **Delete Behavior**: CASCADE (delete user → delete all attendance records)
   - **Purpose**: Track which user's attendance records

3. **To Leaves (as Applicant)**:
   ```
   leaves.user_id → users.id
   ```
   - **Type**: One-to-Many
   - **Delete Behavior**: CASCADE
   - **Purpose**: Track which employee applied for leave

4. **To Leaves (as Approver)**:
   ```
   leaves.approved_by → users.id
   ```
   - **Type**: One-to-Many
   - **Delete Behavior**: SET NULL (preserve leave record, clear approver reference)
   - **Purpose**: Track which HR/Admin approved/rejected the leave

5. **To Payroll (as Employee)**:
   ```
   payroll.user_id → users.id
   ```
   - **Type**: One-to-Many
   - **Delete Behavior**: CASCADE
   - **Purpose**: Track which employee's payroll

6. **To Payroll (as Generator)**:
   ```
   payroll.generated_by → users.id
   ```
   - **Type**: One-to-Many
   - **Delete Behavior**: SET NULL
   - **Purpose**: Track which payroll officer generated the payroll

7. **To Reports**:
   ```
   reports.employee_id → users.id
   ```
   - **Type**: One-to-Many
   - **Delete Behavior**: CASCADE
   - **Purpose**: Track which employee's report

#### Indexes:
- `idx_users_email` - Fast email lookups (login queries)
- `idx_users_role` - Quick role-based filtering
- `idx_users_hr_assigned` - Efficient employee-HR relationship queries

---

### 2. ATTENDANCE Table

**Purpose**: Daily attendance tracking for employees

#### Schema:
```sql
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status attendance_status NOT NULL DEFAULT 'absent',
    check_in_time TIME,
    check_out_time TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)  -- One record per user per day
);
```

#### Field Details:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique attendance record ID |
| `user_id` | INTEGER | FK, NOT NULL, CASCADE | Reference to employee |
| `date` | DATE | NOT NULL | Attendance date |
| `status` | attendance_status (ENUM) | NOT NULL, DEFAULT 'absent' | present, absent, leave |
| `check_in_time` | TIME | NULLABLE | Employee check-in time |
| `check_out_time` | TIME | NULLABLE | Employee check-out time |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |

#### Unique Constraint:
- `(user_id, date)` - **One attendance record per employee per day**
  - Prevents duplicate entries
  - Enforces business rule: employees mark attendance once per day

#### Relationships:

1. **To Users**:
   ```
   attendance.user_id → users.id
   ```
   - **Type**: Many-to-One
   - **Cardinality**: Many attendance records → One user
   - **Delete Behavior**: CASCADE
   - **Business Rule**: If employee is deleted, all their attendance is deleted

#### Indexes:
- `idx_attendance_user_date` - Fast queries for employee attendance history

#### Business Logic:
- Employees can mark attendance **once per day**
- HR/Admin can override/edit attendance records
- Used by payroll system to calculate working days

---

### 3. LEAVES Table

**Purpose**: Employee leave applications and approvals

#### Schema:
```sql
CREATE TABLE leaves (
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
```

#### Field Details:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique leave record ID |
| `user_id` | INTEGER | FK, NOT NULL, CASCADE | Employee who applied |
| `applied_date` | DATE | NOT NULL, DEFAULT CURRENT_DATE | When leave was applied |
| `from_date` | DATE | NOT NULL | Leave start date |
| `to_date` | DATE | NOT NULL | Leave end date |
| `leave_type` | VARCHAR(100) | NOT NULL | Type: Sick, Casual, Annual, etc. |
| `approved_by` | INTEGER | FK, SET NULL | HR/Admin who approved/rejected |
| `status` | leave_status (ENUM) | DEFAULT 'pending' | pending, approved, rejected |
| `paid_status` | paid_status (ENUM) | DEFAULT 'unpaid' | paid, unpaid |
| `reason` | TEXT | NULLABLE | Leave reason/description |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Application time |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

#### Relationships:

1. **To Users (as Applicant)**:
   ```
   leaves.user_id → users.id
   ```
   - **Type**: Many-to-One
   - **Delete Behavior**: CASCADE
   - **Purpose**: Track which employee applied

2. **To Users (as Approver)**:
   ```
   leaves.approved_by → users.id
   ```
   - **Type**: Many-to-One
   - **Delete Behavior**: SET NULL
   - **Purpose**: Track which HR/Admin approved/rejected
   - **Note**: If approver is deleted, leave record remains but approver reference is cleared

#### Indexes:
- `idx_leaves_user` - Fast employee leave history queries
- `idx_leaves_status` - Quick pending leaves queries

#### Business Logic:
1. Employee applies → Status: 'pending'
2. HR/Admin reviews → Status: 'approved' or 'rejected'
3. If approved → `paid_status` set to 'paid' or 'unpaid'
4. Payroll system uses `paid_status` for salary calculations

---

### 4. PAYROLL Table

**Purpose**: Monthly payroll calculations and payslips

#### Schema:
```sql
CREATE TABLE payroll (
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
    UNIQUE(user_id, month, year)  -- One payroll per employee per month
);
```

#### Field Details:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique payroll record ID |
| `user_id` | INTEGER | FK, NOT NULL, CASCADE | Employee |
| `month` | INTEGER | NOT NULL, CHECK (1-12) | Payroll month (1-12) |
| `year` | INTEGER | NOT NULL | Payroll year |
| `basic_salary` | NUMERIC(10,2) | NOT NULL | Employee's base salary |
| `paid_leaves` | INTEGER | DEFAULT 0 | Number of paid leave days |
| `unpaid_leaves` | INTEGER | DEFAULT 0 | Number of unpaid leave days |
| `pf_deduction` | NUMERIC(10,2) | DEFAULT 0 | Provident Fund (12% of basic) |
| `professional_tax` | NUMERIC(10,2) | DEFAULT 0 | Professional tax (₹200) |
| `net_salary` | NUMERIC(10,2) | NOT NULL | Final salary after deductions |
| `generated_by` | INTEGER | FK, SET NULL | Payroll officer/admin who generated |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Generation time |

#### Unique Constraint:
- `(user_id, month, year)` - **One payroll per employee per month**
  - Prevents duplicate payroll generation
  - Ensures data integrity

#### Check Constraint:
- `month >= 1 AND month <= 12` - Validates month range

#### Relationships:

1. **To Users (as Employee)**:
   ```
   payroll.user_id → users.id
   ```
   - **Type**: Many-to-One
   - **Delete Behavior**: CASCADE
   - **Purpose**: Track which employee's payroll

2. **To Users (as Generator)**:
   ```
   payroll.generated_by → users.id
   ```
   - **Type**: Many-to-One
   - **Delete Behavior**: SET NULL
   - **Purpose**: Audit trail of who generated payroll

#### Payroll Calculation Formula:

```javascript
// Step 1: Calculate daily salary
daily_salary = basic_salary / 30

// Step 2: Calculate unpaid leave deduction
unpaid_leave_deduction = unpaid_leaves * daily_salary

// Step 3: Calculate PF (12% of basic salary)
pf_deduction = basic_salary * 0.12

// Step 4: Professional Tax (Fixed)
professional_tax = 200

// Step 5: Calculate Net Salary
net_salary = basic_salary 
           - unpaid_leave_deduction 
           - pf_deduction 
           - professional_tax
```

#### Indexes:
- `idx_payroll_user_month_year` - Fast employee payroll lookups
- `idx_payroll_month_year` - Monthly/yearly payroll reports

---

### 5. REPORTS Table (Optional Caching)

**Purpose**: Cache aggregated report data for performance

#### Schema:
```sql
CREATE TABLE reports (
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
```

#### Field Details:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique report record ID |
| `employee_id` | INTEGER | FK, NOT NULL, CASCADE | Employee |
| `report_month` | INTEGER | NULLABLE | Report month |
| `report_year` | INTEGER | NULLABLE | Report year |
| `total_salary` | NUMERIC(10,2) | NULLABLE | Aggregated total salary |
| `total_deductions` | NUMERIC(10,2) | NULLABLE | Total deductions |
| `pf` | NUMERIC(10,2) | NULLABLE | Total PF deductions |
| `tax` | NUMERIC(10,2) | NULLABLE | Total tax |
| `unpaid_days` | INTEGER | NULLABLE | Total unpaid leave days |
| `generated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Report generation time |

#### Relationships:

1. **To Users**:
   ```
   reports.employee_id → users.id
   ```
   - **Type**: Many-to-One
   - **Delete Behavior**: CASCADE
   - **Purpose**: Track which employee's cached report

#### Note:
- This table is **optional** and used for performance optimization
- Can be populated periodically to cache report data
- Reduces query time for frequently accessed reports

---

## 🔄 Relationship Flow Diagram

```
                    ┌─────────────┐
                    │    USERS    │
                    │  (Core)     │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        │                  │                  │
   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
   │ATTENDANCE│       │ LEAVES  │       │ PAYROLL │
   │          │       │         │       │         │
   │ user_id  │       │ user_id │       │ user_id │
   │          │       │approved │       │generated│
   │          │       │_by (FK) │       │_by (FK) │
   └──────────┘       └─────────┘       └─────────┘
        │                  │                  │
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────▼──────┐
                    │   REPORTS   │
                    │             │
                    │ employee_id │
                    └─────────────┘

Self-Reference:
    USERS.hr_assigned_id → USERS.id
    (Many employees → One HR officer)
```

---

## 🔐 Foreign Key Constraints Summary

| Child Table | Foreign Key | Parent Table | Delete Behavior | Purpose |
|-------------|-------------|--------------|-----------------|---------|
| `users` | `hr_assigned_id` | `users.id` | SET NULL | HR assignment |
| `attendance` | `user_id` | `users.id` | CASCADE | Employee attendance |
| `leaves` | `user_id` | `users.id` | CASCADE | Leave applicant |
| `leaves` | `approved_by` | `users.id` | SET NULL | Leave approver |
| `payroll` | `user_id` | `users.id` | CASCADE | Payroll employee |
| `payroll` | `generated_by` | `users.id` | SET NULL | Payroll generator |
| `reports` | `employee_id` | `users.id` | CASCADE | Report employee |

### Delete Behavior Explanation:

- **CASCADE**: When parent record is deleted, all child records are automatically deleted
  - Used for: attendance, leaves (as applicant), payroll (as employee), reports
  - Reason: These are dependent data that shouldn't exist without the user

- **SET NULL**: When parent record is deleted, foreign key is set to NULL
  - Used for: hr_assigned_id, approved_by, generated_by
  - Reason: Preserve historical data but clear the reference

---

## 📊 Indexes for Performance

| Index Name | Table | Columns | Purpose |
|------------|-------|---------|---------|
| `idx_users_email` | users | email | Fast login queries |
| `idx_users_role` | users | role | Role-based filtering |
| `idx_users_hr_assigned` | users | hr_assigned_id | Employee-HR queries |
| `idx_attendance_user_date` | attendance | user_id, date | Attendance history |
| `idx_leaves_user` | leaves | user_id | Employee leave history |
| `idx_leaves_status` | leaves | status | Pending leaves queries |
| `idx_payroll_user_month_year` | payroll | user_id, month, year | Payroll lookups |
| `idx_payroll_month_year` | payroll | month, year | Monthly reports |

---

## 🎯 Data Integrity Rules

1. **Email Uniqueness**: No two users can have the same email
2. **One Attendance Per Day**: Unique constraint on (user_id, date)
3. **One Payroll Per Month**: Unique constraint on (user_id, month, year)
4. **Valid Month Range**: Payroll month must be 1-12
5. **Referential Integrity**: All foreign keys must reference existing records
6. **ENUM Constraints**: Status fields can only have predefined values

---

## 🔄 Triggers & Functions

### Auto-Update Timestamp Function
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';
```

### Triggers Applied:
- **users.updated_at**: Auto-updates on any UPDATE
- **leaves.updated_at**: Auto-updates on any UPDATE

---

## 📈 Database Statistics

- **Total Tables**: 5
- **Total ENUM Types**: 5
- **Total Foreign Keys**: 7
- **Total Indexes**: 8
- **Total Triggers**: 2
- **Self-Referencing Relationships**: 1

---

This schema design ensures:
✅ Data integrity through foreign keys and constraints
✅ Performance optimization through indexes
✅ Audit trails through timestamps and approver tracking
✅ Flexible relationships through proper delete behaviors
✅ Scalability through normalized structure


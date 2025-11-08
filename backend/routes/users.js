const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all users (Admin only)
router.get('/', verifyToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT 
        u.id, u.name, u.email, u.login_id, u.role, u.department, u.base_salary, 
        u.status, u.created_at, u.hr_assigned_id, u.first_name, u.last_name,
        u.phone_number, u.year_of_joining, u.employee_number,
        hr.name as hr_name, hr.email as hr_email
      FROM users u
      LEFT JOIN users hr ON u.hr_assigned_id = hr.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ' ORDER BY u.created_at DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      users: result.rows
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// Get user profile (with all fields) - User can view own profile
// NOTE: This must come before /:id route to avoid route conflicts
router.get('/:id/profile', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    // Users can only view their own profile, unless they're admin/hr
    if (req.user.role === 'employee' && userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own profile.'
      });
    }

    // HR can only view their assigned employees
    if (req.user.role === 'hr' && userId !== req.user.id) {
      const assignedCheck = await pool.query(
        'SELECT id FROM users WHERE id = $1 AND hr_assigned_id = $2',
        [userId, req.user.id]
      );
      if (assignedCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your assigned employees.'
        });
      }
    }

    const result = await pool.query(
      `SELECT 
        u.*, 
        m.name as manager_name, m.email as manager_email,
        hr.name as hr_name, hr.email as hr_email
      FROM users u
      LEFT JOIN users m ON u.manager_id = m.id
      LEFT JOIN users hr ON u.hr_assigned_id = hr.id
      WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = result.rows[0];
    // Parse array fields if they're stored as strings
    if (typeof user.skills === 'string') {
      try {
        user.skills = JSON.parse(user.skills);
      } catch (e) {
        user.skills = user.skills ? [user.skills] : [];
      }
    }
    if (typeof user.certifications === 'string') {
      try {
        user.certifications = JSON.parse(user.certifications);
      } catch (e) {
        user.certifications = user.certifications ? [user.certifications] : [];
      }
    }

    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
});

// Update user profile
router.put('/:id/profile', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    // Users can only update their own profile
    if (req.user.role === 'employee' && userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own profile.'
      });
    }

    // HR can only update their assigned employees
    if (req.user.role === 'hr' && userId !== req.user.id) {
      const assignedCheck = await pool.query(
        'SELECT id FROM users WHERE id = $1 AND hr_assigned_id = $2',
        [userId, req.user.id]
      );
      if (assignedCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only update your assigned employees.'
        });
      }
    }

    const {
      name, first_name, last_name, email, phone_number, department, location, job_position,
      date_of_birth, residing_address, nationality, personal_email,
      gender, marital_status, about, job_likes, interests_hobbies,
      resume, skills, certifications, bank_account_number, bank_name,
      ifsc_code, pan_number, uan_number, month_wage, yearly_wage,
      working_days_per_week, break_time_hours
    } = req.body;

    // Build update query dynamically
    const updateFields = [];
    const params = [];
    let paramCount = 1;

    // Handle array fields
    let skillsArray = null;
    let certsArray = null;
    
    if (skills !== undefined) {
      skillsArray = Array.isArray(skills) ? skills : (typeof skills === 'string' && skills ? JSON.parse(skills) : []);
    }
    if (certifications !== undefined) {
      certsArray = Array.isArray(certifications) ? certifications : (typeof certifications === 'string' && certifications ? JSON.parse(certifications) : []);
    }

    if (name !== undefined) {
      updateFields.push(`name = $${paramCount++}`);
      params.push(name);
    }
    if (first_name !== undefined) {
      updateFields.push(`first_name = $${paramCount++}`);
      params.push(first_name);
    }
    if (last_name !== undefined) {
      updateFields.push(`last_name = $${paramCount++}`);
      params.push(last_name);
    }
    if (email !== undefined) {
      updateFields.push(`email = $${paramCount++}`);
      params.push(email);
    }
    if (phone_number !== undefined) {
      updateFields.push(`phone_number = $${paramCount++}`);
      params.push(phone_number);
    }
    if (department !== undefined) {
      updateFields.push(`department = $${paramCount++}`);
      params.push(department);
    }
    if (location !== undefined) {
      updateFields.push(`location = $${paramCount++}`);
      params.push(location);
    }
    if (job_position !== undefined) {
      updateFields.push(`job_position = $${paramCount++}`);
      params.push(job_position);
    }
    if (date_of_birth !== undefined) {
      updateFields.push(`date_of_birth = $${paramCount++}`);
      params.push(date_of_birth);
    }
    if (residing_address !== undefined) {
      updateFields.push(`residing_address = $${paramCount++}`);
      params.push(residing_address);
    }
    if (nationality !== undefined) {
      updateFields.push(`nationality = $${paramCount++}`);
      params.push(nationality);
    }
    if (personal_email !== undefined) {
      updateFields.push(`personal_email = $${paramCount++}`);
      params.push(personal_email);
    }
    if (gender !== undefined) {
      updateFields.push(`gender = $${paramCount++}`);
      params.push(gender);
    }
    if (marital_status !== undefined) {
      updateFields.push(`marital_status = $${paramCount++}`);
      params.push(marital_status);
    }
    if (about !== undefined) {
      updateFields.push(`about = $${paramCount++}`);
      params.push(about);
    }
    if (job_likes !== undefined) {
      updateFields.push(`job_likes = $${paramCount++}`);
      params.push(job_likes);
    }
    if (interests_hobbies !== undefined) {
      updateFields.push(`interests_hobbies = $${paramCount++}`);
      params.push(interests_hobbies);
    }
    if (resume !== undefined) {
      updateFields.push(`resume = $${paramCount++}`);
      params.push(resume);
    }
    if (skillsArray !== null && skillsArray !== undefined) {
      updateFields.push(`skills = $${paramCount++}`);
      params.push(JSON.stringify(skillsArray));
    }
    if (certsArray !== null && certsArray !== undefined) {
      updateFields.push(`certifications = $${paramCount++}`);
      params.push(JSON.stringify(certsArray));
    }
    if (bank_account_number !== undefined) {
      updateFields.push(`bank_account_number = $${paramCount++}`);
      params.push(bank_account_number);
    }
    if (bank_name !== undefined) {
      updateFields.push(`bank_name = $${paramCount++}`);
      params.push(bank_name);
    }
    if (ifsc_code !== undefined) {
      updateFields.push(`ifsc_code = $${paramCount++}`);
      params.push(ifsc_code);
    }
    if (pan_number !== undefined) {
      updateFields.push(`pan_number = $${paramCount++}`);
      params.push(pan_number);
    }
    if (uan_number !== undefined) {
      updateFields.push(`uan_number = $${paramCount++}`);
      params.push(uan_number);
    }
    // Only admin/payroll can update salary info
    if ((req.user.role === 'admin' || req.user.role === 'payroll')) {
      if (month_wage !== undefined) {
        updateFields.push(`month_wage = $${paramCount++}`);
        params.push(month_wage);
      }
      if (yearly_wage !== undefined) {
        updateFields.push(`yearly_wage = $${paramCount++}`);
        params.push(yearly_wage);
      }
      if (working_days_per_week !== undefined) {
        updateFields.push(`working_days_per_week = $${paramCount++}`);
        params.push(working_days_per_week);
      }
      if (break_time_hours !== undefined) {
        updateFields.push(`break_time_hours = $${paramCount++}`);
        params.push(break_time_hours);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    params.push(userId);
    const query = `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
    
    const result = await pool.query(query, params);
    
    // Parse array fields
    const updatedUser = result.rows[0];
    if (typeof updatedUser.skills === 'string') {
      try {
        updatedUser.skills = JSON.parse(updatedUser.skills);
      } catch (e) {
        updatedUser.skills = updatedUser.skills ? [updatedUser.skills] : [];
      }
    }
    if (typeof updatedUser.certifications === 'string') {
      try {
        updatedUser.certifications = JSON.parse(updatedUser.certifications);
      } catch (e) {
        updatedUser.certifications = updatedUser.certifications ? [updatedUser.certifications] : [];
      }
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
});

// Update user avatar
router.put('/:id/avatar', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    const { avatar } = req.body;

    // Users can only update their own avatar
    if (req.user.role === 'employee' && userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own avatar.'
      });
    }

    if (!avatar) {
      return res.status(400).json({
        success: false,
        message: 'Avatar is required'
      });
    }

    await pool.query(
      'UPDATE users SET avatar = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [avatar, userId]
    );

    res.json({
      success: true,
      message: 'Avatar updated successfully'
    });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating avatar',
      error: error.message
    });
  }
});

// Get user by ID (HR/Admin)
router.get('/:id', verifyToken, authorizeRoles('admin', 'hr'), async (req, res) => {
  try {
    const { id } = req.params;

    // HR can only view their assigned employees
    if (req.user.role === 'hr' && parseInt(id) !== req.user.id) {
      const result = await pool.query(
        'SELECT id FROM users WHERE id = $1 AND hr_assigned_id = $2',
        [id, req.user.id]
      );
      if (result.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your assigned employees.'
        });
      }
    }

    const userResult = await pool.query(
      `SELECT 
        u.*,
        m.name as manager_name, m.email as manager_email,
        hr.name as hr_name, hr.email as hr_email
      FROM users u
      LEFT JOIN users m ON u.manager_id = m.id
      LEFT JOIN users hr ON u.hr_assigned_id = hr.id
      WHERE u.id = $1`,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: userResult.rows[0]
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

// Helper function to generate login ID
function generateLoginId(firstName, lastName, year, employeeNumber) {
  const firstTwo = (firstName || '').substring(0, 2).toLowerCase().padEnd(2, 'x');
  const lastTwo = (lastName || '').substring(0, 2).toLowerCase().padEnd(2, 'x');
  const yearStr = year.toString();
  const empNum = employeeNumber.toString().padStart(3, '0');
  return `${firstTwo}${lastTwo}${yearStr}${empNum}`;
}

// Create user (Admin/HR only)
router.post('/', verifyToken, authorizeRoles('admin', 'hr'), async (req, res) => {
  try {
    const { 
      first_name, 
      last_name, 
      email, 
      phone_number, 
      role, 
      department, 
      base_salary, 
      hr_assigned_id,
      year_of_joining,
      company_name,
      company_logo
    } = req.body;

    // Validate input
    if (!first_name || !last_name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide first name, last name, email, and role'
      });
    }

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Validate HR assigned if provided
    if (hr_assigned_id) {
      const hrCheck = await pool.query('SELECT role FROM users WHERE id = $1', [hr_assigned_id]);
      if (hrCheck.rows.length === 0 || hrCheck.rows[0].role !== 'hr') {
        return res.status(400).json({
          success: false,
          message: 'Invalid HR assigned ID'
        });
      }
    }

    // Get year of joining (default to current year)
    const joiningYear = year_of_joining || new Date().getFullYear();

    // Get next employee number for the year
    const empNumResult = await pool.query(
      'SELECT get_next_employee_number($1) as next_number',
      [joiningYear]
    );
    const employeeNumber = empNumResult.rows[0].next_number;

    // Generate login ID
    const loginId = generateLoginId(first_name, last_name, joiningYear, employeeNumber);

    // Check if login_id already exists (unlikely but possible)
    let finalLoginId = loginId;
    let counter = 1;
    while (true) {
      const existing = await pool.query('SELECT id FROM users WHERE login_id = $1', [finalLoginId]);
      if (existing.rows.length === 0) break;
      finalLoginId = `${loginId}${counter}`;
      counter++;
    }

    // Generate system password (random 8-character alphanumeric)
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let systemPasswordFinal = '';
    for (let i = 0; i < 8; i++) {
      systemPasswordFinal += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Hash password
    const passwordHash = await bcrypt.hash(systemPasswordFinal, 10);

    // Combine first and last name for full name
    const fullName = `${first_name} ${last_name}`;

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (
        name, first_name, last_name, email, phone_number, login_id, 
        password_hash, role, department, base_salary, hr_assigned_id, 
        status, year_of_joining, employee_number, password_changed,
        company_name, company_logo
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active', $12, $13, false, $14, $15)
       RETURNING id, name, first_name, last_name, email, login_id, phone_number, 
       role, department, base_salary, hr_assigned_id, status, created_at, 
       year_of_joining, employee_number, company_name`,
      [
        fullName, first_name, last_name, email, phone_number || null, finalLoginId,
        passwordHash, role, department || null, base_salary || 0, hr_assigned_id || null,
        joiningYear, employeeNumber, company_name || null, company_logo || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: result.rows[0],
      systemPassword: systemPasswordFinal, // Return system-generated password
      loginId: finalLoginId
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
});

// Update user (HR/Admin)
router.put('/:id', verifyToken, authorizeRoles('admin', 'hr'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, department, base_salary, hr_assigned_id, status } = req.body;

    // Check if user exists
    const userCheck = await pool.query('SELECT id, role FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only admin can edit all fields, HR can edit limited fields
    if (req.user.role === 'hr') {
      // HR can only edit their assigned employees
      const assignedCheck = await pool.query(
        'SELECT id FROM users WHERE id = $1 AND hr_assigned_id = $2',
        [id, req.user.id]
      );
      if (assignedCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only edit your assigned employees.'
        });
      }
      // HR cannot change role, status, or hr_assigned_id
      const updateFields = [];
      const params = [];
      let paramCount = 1;

      if (name) {
        updateFields.push(`name = $${paramCount++}`);
        params.push(name);
      }
      if (email) {
        updateFields.push(`email = $${paramCount++}`);
        params.push(email);
      }
      if (department !== undefined) {
        updateFields.push(`department = $${paramCount++}`);
        params.push(department);
      }
      if (base_salary !== undefined) {
        updateFields.push(`base_salary = $${paramCount++}`);
        params.push(base_salary);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }

      params.push(id);
      // Handle NULL values properly in the query
      const query = `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount}`;
      await pool.query(query, params);
    } else {
      // Admin can edit everything
      const updateFields = [];
      const params = [];
      let paramCount = 1;

      if (name !== undefined && name !== null) {
        updateFields.push(`name = $${paramCount++}`);
        params.push(name);
      }
      if (email !== undefined && email !== null) {
        updateFields.push(`email = $${paramCount++}`);
        params.push(email);
      }
      if (role !== undefined && role !== null) {
        updateFields.push(`role = $${paramCount++}`);
        params.push(role);
      }
      if (department !== undefined) {
        if (department === null || department === '') {
          updateFields.push(`department = NULL`);
        } else {
          updateFields.push(`department = $${paramCount++}`);
          params.push(department);
        }
      }
      if (base_salary !== undefined) {
        updateFields.push(`base_salary = $${paramCount++}`);
        params.push(parseFloat(base_salary) || 0);
      }
      if (hr_assigned_id !== undefined) {
        if (hr_assigned_id === null || hr_assigned_id === '' || hr_assigned_id === 0) {
          updateFields.push(`hr_assigned_id = NULL`);
        } else {
          updateFields.push(`hr_assigned_id = $${paramCount++}`);
          params.push(parseInt(hr_assigned_id));
        }
      }
      if (status !== undefined && status !== null && status !== '') {
        updateFields.push(`status = $${paramCount++}`);
        params.push(status);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
      }

      params.push(id);
      const query = `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount}`;
      await pool.query(query, params);
    }

    // Get updated user
    const result = await pool.query(
      `SELECT 
        u.id, u.name, u.email, u.role, u.department, u.base_salary, 
        u.status, u.created_at, u.hr_assigned_id,
        hr.name as hr_name, hr.email as hr_email
      FROM users u
      LEFT JOIN users hr ON u.hr_assigned_id = hr.id
      WHERE u.id = $1`,
      [id]
    );

    res.json({
      success: true,
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// Delete user (Admin only)
router.delete('/:id', verifyToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

// Get HR officers list (for dropdowns)
router.get('/list/hr', verifyToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email FROM users WHERE role = $1 AND status = $2 ORDER BY name',
      ['hr', 'active']
    );

    console.log(`Found ${result.rows.length} HR officers`);
    res.json({
      success: true,
      hrOfficers: result.rows
    });
  } catch (error) {
    console.error('Get HR officers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching HR officers',
      error: error.message
    });
  }
});

// Get assigned employees (HR only)
router.get('/assigned/mine', verifyToken, authorizeRoles('hr'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        u.id, u.name, u.email, u.role, u.department, u.base_salary, 
        u.status, u.created_at, u.hr_assigned_id
      FROM users u
      WHERE u.hr_assigned_id = $1 AND u.role = 'employee'
      ORDER BY u.name`,
      [req.user.id]
    );

    res.json({
      success: true,
      employees: result.rows
    });
  } catch (error) {
    console.error('Get assigned employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assigned employees',
      error: error.message
    });
  }
});

module.exports = router;


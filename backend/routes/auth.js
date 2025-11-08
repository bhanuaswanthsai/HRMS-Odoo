const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Register company (Public - for new companies)
router.post('/register-company', async (req, res) => {
  try {
    console.log('=== Company Registration Request ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const {
      company_name,
      company_logo,
      company_address,
      company_phone,
      company_email,
      admin_first_name,
      admin_last_name,
      admin_email,
      admin_phone,
      admin_password
    } = req.body;

    // Validate input
    if (!company_name || !company_email || !admin_first_name || !admin_last_name || !admin_email || !admin_password) {
      console.log('Validation failed - missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
        missing: {
          company_name: !company_name,
          company_email: !company_email,
          admin_first_name: !admin_first_name,
          admin_last_name: !admin_last_name,
          admin_email: !admin_email,
          admin_password: !admin_password
        }
      });
    }
    
    console.log('All required fields present');

    // Check if company email already exists
    console.log('Checking company email:', company_email);
    const existingCompany = await pool.query(
      'SELECT id FROM users WHERE company_email = $1',
      [company_email]
    );
    if (existingCompany.rows.length > 0) {
      console.log('Company email already exists');
      return res.status(400).json({
        success: false,
        message: 'Company with this email already exists'
      });
    }

    // Check if admin email already exists
    console.log('Checking admin email:', admin_email);
    const existingAdmin = await pool.query('SELECT id FROM users WHERE email = $1', [admin_email]);
    if (existingAdmin.rows.length > 0) {
      console.log('Admin email already exists');
      return res.status(400).json({
        success: false,
        message: 'Admin email already exists'
      });
    }
    
    console.log('Email checks passed');

    // Validate name lengths for login ID generation
    if (admin_first_name.length < 2 || admin_last_name.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'First name and last name must be at least 2 characters long'
      });
    }

    // Generate admin login ID
    const currentYear = new Date().getFullYear();
    console.log('Getting employee number for year:', currentYear);
    const empNumResult = await pool.query(
      'SELECT get_next_employee_number($1) as next_number',
      [currentYear]
    );
    const employeeNumber = empNumResult.rows[0].next_number;
    console.log('Employee number:', employeeNumber);
    
    // Generate base login ID (max 50 chars: 2+2+4+3 = 11 chars base, leaving room for counter)
    let adminLoginId = `${admin_first_name.substring(0, 2).toLowerCase()}${admin_last_name.substring(0, 2).toLowerCase()}${currentYear}${employeeNumber.toString().padStart(3, '0')}`;
    console.log('Generated login ID:', adminLoginId);
    
    // Ensure login_id is unique and within 50 character limit
    let counter = 1;
    const maxAttempts = 999; // Reasonable limit
    while (counter <= maxAttempts) {
      const existingLoginId = await pool.query('SELECT id FROM users WHERE login_id = $1', [adminLoginId]);
      if (existingLoginId.rows.length === 0) {
        // Check length before using
        if (adminLoginId.length <= 50) {
          console.log('Unique login ID found:', adminLoginId);
          break;
        }
      }
      // Generate new ID with counter (ensure it fits in 50 chars)
      const suffix = counter.toString();
      const baseId = `${admin_first_name.substring(0, 2).toLowerCase()}${admin_last_name.substring(0, 2).toLowerCase()}${currentYear}${employeeNumber.toString().padStart(3, '0')}`;
      adminLoginId = baseId.substring(0, 50 - suffix.length) + suffix;
      counter++;
    }
    
    if (counter > maxAttempts) {
      console.log('Failed to generate unique login ID after', maxAttempts, 'attempts');
      return res.status(500).json({
        success: false,
        message: 'Unable to generate unique login ID. Please try again.'
      });
    }

    // Hash admin password
    console.log('Hashing password...');
    const passwordHash = await bcrypt.hash(admin_password, 10);

    // Create admin user with company information
    const adminFullName = `${admin_first_name} ${admin_last_name}`;
    
    const insertParams = [
      adminFullName, admin_first_name, admin_last_name, admin_email,
      admin_phone || null, adminLoginId, passwordHash, 'admin',
      'Administration', 0, 'active', currentYear, employeeNumber, true,
      company_name, company_logo || null, company_email
    ];
    
    console.log('Attempting to insert user with params:', {
      name: adminFullName,
      email: admin_email,
      login_id: adminLoginId,
      role: 'admin',
      status: 'active',
      company_name: company_name,
      company_email: company_email
    });
    
    const result = await pool.query(
      `INSERT INTO users (
        name, first_name, last_name, email, phone_number, login_id,
        password_hash, role, department, base_salary, status,
        year_of_joining, employee_number, password_changed,
        company_name, company_logo, company_email
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING id, name, email, login_id, role, company_name, company_email`,
      insertParams
    );
    
    console.log('User created successfully:', result.rows[0]);

    res.status(201).json({
      success: true,
      message: 'Company registered successfully',
      company_name: company_name,
      admin_email: admin_email,
      admin_login_id: adminLoginId
    });
  } catch (error) {
    console.error('=== REGISTER COMPANY ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    console.error('Error hint:', error.hint);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    
    // Provide more specific error messages
    let errorMessage = 'Error registering company';
    if (error.code === '23505') { // Unique violation
      if (error.detail && error.detail.includes('email')) {
        errorMessage = 'Email already exists';
      } else if (error.detail && error.detail.includes('login_id')) {
        errorMessage = 'Login ID conflict. Please try again.';
      } else {
        errorMessage = 'Duplicate entry. Please check your information.';
      }
    } else if (error.code === '23502') { // Not null violation
      errorMessage = 'Missing required field: ' + (error.column || 'unknown');
    } else if (error.code === '23503') { // Foreign key violation
      errorMessage = 'Invalid reference data';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message,
      code: error.code,
      detail: error.detail,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Register new user (Admin only) - Legacy endpoint
router.post('/register', verifyToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { name, email, password, role, department, base_salary, hr_assigned_id } = req.body;

    // Validate input
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and role'
      });
    }

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department, base_salary, hr_assigned_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
       RETURNING id, name, email, role, department, base_salary, hr_assigned_id, status`,
      [name, email, passwordHash, role, department || null, base_salary || 0, hr_assigned_id || null]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
});

// Login (using Login ID or Email)
router.post('/login', async (req, res) => {
  try {
    const { login_id, email, password } = req.body;

    // Accept either login_id or email
    const identifier = login_id || email;
    
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Login ID or Email and password'
      });
    }

    // Get user from database using login_id OR email
    const result = await pool.query(
      `SELECT id, name, email, login_id, password_hash, role, hr_assigned_id, 
       department, base_salary, status, password_changed, first_name, last_name, 
       phone_number, year_of_joining, employee_number, company_name 
       FROM users WHERE login_id = $1 OR email = $1`,
      [identifier.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Login ID/Email or password'
      });
    }

    const user = result.rows[0];

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive. Please contact admin.'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Login ID or password'
      });
    }

    // Check if password needs to be changed (first login)
    if (!user.password_changed) {
      return res.status(200).json({
        success: true,
        message: 'Please change your password',
        requiresPasswordChange: true,
        user: {
          id: user.id,
          login_id: user.login_id,
          name: user.name,
          email: user.email
        }
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, login_id: user.login_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Remove password_hash from response
    delete user.password_hash;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user,
      requiresPasswordChange: false
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
  }
});

// Get current user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    // Get full user data including login_id
    const userResult = await pool.query(
      `SELECT id, name, email, login_id, role, hr_assigned_id, department, 
       base_salary, status, first_name, last_name, phone_number, 
       year_of_joining, employee_number, company_name, company_logo 
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Get HR assigned info if exists
    let hrInfo = null;
    if (user.hr_assigned_id) {
      const hrResult = await pool.query(
        'SELECT id, name, email FROM users WHERE id = $1',
        [user.hr_assigned_id]
      );
      if (hrResult.rows.length > 0) {
        hrInfo = hrResult.rows[0];
      }
    }

    res.json({
      success: true,
      user: {
        ...user,
        hr_assigned: hrInfo
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
});

// Change password (for first login or regular password change)
router.put('/change-password', async (req, res) => {
  try {
    const { login_id, old_password, new_password, is_first_login } = req.body;

    // For first login, login_id and new_password are required
    if (is_first_login) {
      if (!login_id || !new_password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide Login ID and new password'
        });
      }

      // Get user by login_id
      const userResult = await pool.query(
        'SELECT id, password_hash, password_changed FROM users WHERE login_id = $1',
        [login_id.toLowerCase()]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = userResult.rows[0];

      // Verify old password (system-generated password)
      if (old_password) {
        const isValidPassword = await bcrypt.compare(old_password, user.password_hash);
        if (!isValidPassword) {
          return res.status(400).json({
            success: false,
            message: 'Invalid current password'
          });
        }
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(new_password, 10);

      // Update password and mark as changed
      await pool.query(
        'UPDATE users SET password_hash = $1, password_changed = true WHERE id = $2',
        [newPasswordHash, user.id]
      );

      return res.json({
        success: true,
        message: 'Password changed successfully. You can now login with your new password.'
      });
    }

    // Regular password change (requires authentication token)
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;

      if (!old_password || !new_password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide old password and new password'
        });
      }

      // Get current user password
      const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const currentPasswordHash = result.rows[0].password_hash;

      // Verify old password
      const isValidPassword = await bcrypt.compare(old_password, currentPasswordHash);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Invalid old password'
        });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(new_password, 10);

      // Update password
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, userId]);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
});

module.exports = router;


const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Register new user (Admin only)
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

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Get user from database
    const result = await pool.query(
      'SELECT id, name, email, password_hash, role, hr_assigned_id, department, base_salary, status FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
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
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Remove password_hash from response
    delete user.password_hash;
    res.json({
      success: true,
      message: 'Login successfullllllll',
      token,
      user,
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
    // Get user from database with profile image info
    const userResult = await pool.query(
      `SELECT 
        id, name, email, role, hr_assigned_id, department, base_salary, status,
        CASE WHEN profile_image IS NOT NULL THEN true ELSE false END as has_profile_image
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

// Change password
router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide old password and new password'
      });
    }

    // Get current user password
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
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
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, req.user.id]);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
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


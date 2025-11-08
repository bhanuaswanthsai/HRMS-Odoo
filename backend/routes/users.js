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
        u.id, u.name, u.email, u.role, u.department, u.base_salary, 
        u.status, u.created_at, u.hr_assigned_id,
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
        u.id, u.name, u.email, u.role, u.department, u.base_salary, 
        u.status, u.created_at, u.hr_assigned_id,
        hr.name as hr_name, hr.email as hr_email
      FROM users u
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

// Create user (Admin only)
router.post('/', verifyToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { name, email, password, role, department, base_salary, hr_assigned_id } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and role'
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

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department, base_salary, hr_assigned_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
       RETURNING id, name, email, role, department, base_salary, hr_assigned_id, status, created_at`,
      [name, email, passwordHash, role, department || null, base_salary || 0, hr_assigned_id || null]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: result.rows[0]
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


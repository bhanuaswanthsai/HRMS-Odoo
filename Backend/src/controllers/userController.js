import { UserModel } from '../models/User.js';
import { hashPassword } from '../utils/password.js';
import { validationResult } from 'express-validator';
import pool from '../config/database.js';

// Get all users (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id, u.email, u.role, u.profile_data, u.created_at, u.updated_at,
        e.id as employee_id, e.employee_id as emp_id, e.department, e.designation
      FROM users u
      LEFT JOIN employees e ON u.id = e.user_id
      ORDER BY u.created_at DESC
    `;
    const result = await pool.query(query);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Create user (Admin only)
export const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, role, profile_data } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Validate role
    const validRoles = ['admin', 'hr_officer', 'payroll_officer', 'employee'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role. Must be one of: admin, hr_officer, payroll_officer, employee' 
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await UserModel.create({
      email,
      password: hashedPassword,
      role: role || 'employee',
      profile_data: {
        ...profile_data,
        created_by: req.user.id,
      },
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile_data: user.profile_data,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update user (Admin only)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, profile_data } = req.body;

    // Validate role if provided
    if (role) {
      const validRoles = ['admin', 'hr_officer', 'payroll_officer', 'employee'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid role' 
        });
      }
    }

    // Get existing user
    const existingUser = await UserModel.findById(id);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update user
    const updates = [];
    const params = [];
    let paramCount = 1;

    if (role) {
      updates.push(`role = $${paramCount++}`);
      params.push(role);
    }

    if (profile_data) {
      updates.push(`profile_data = $${paramCount++}`);
      params.push(JSON.stringify(profile_data));
    }

    if (updates.length === 0) {
      return res.json({ success: true, data: existingUser });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, role, profile_data, updated_at
    `;
    const result = await pool.query(query, params);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Delete user (Admin only)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'You cannot delete your own account' 
      });
    }

    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete user (cascade will handle related records)
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id, email';
    const result = await pool.query(query, [id]);

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Change password (Admin can change any user's password)
export const changeUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const hashedPassword = await hashPassword(password);
    await UserModel.updatePassword(id, hashedPassword);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


const express = require('express');
const { pool } = require('../config/database');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Apply for leave (Employee)
router.post('/apply', verifyToken, authorizeRoles('employee'), async (req, res) => {
  try {
    const { from_date, to_date, leave_type, reason } = req.body;
    const userId = req.user.id;

    if (!from_date || !to_date || !leave_type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide from_date, to_date, and leave_type'
      });
    }

    // Validate dates
    const fromDate = new Date(from_date);
    const toDate = new Date(to_date);

    if (fromDate > toDate) {
      return res.status(400).json({
        success: false,
        message: 'From date cannot be after to date'
      });
    }

    // Prevent overlapping leaves (check against pending or approved)
    const overlapCheck = await pool.query(
      `SELECT id, from_date, to_date, status
       FROM leaves
       WHERE user_id = $1
         AND status IN ('pending','approved')
         AND NOT ($3 < from_date OR $2 > to_date)`,
      [userId, from_date, to_date]
    );

    if (overlapCheck.rows.length > 0) {
      const conflicts = overlapCheck.rows.map(r => ({ id: r.id, from_date: r.from_date, to_date: r.to_date, status: r.status }));
      return res.status(400).json({
        success: false,
        message: 'Requested leave dates overlap with an existing leave application',
        conflicts
      });
    }

    // Insert leave application
    const result = await pool.query(
      `INSERT INTO leaves (user_id, applied_date, from_date, to_date, leave_type, reason, status)
       VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, 'pending')
       RETURNING id, user_id, applied_date, from_date, to_date, leave_type, status, paid_status, reason, created_at`,
      [userId, from_date, to_date, leave_type, reason || null]
    );

    res.status(201).json({
      success: true,
      message: 'Leave applied successfully',
      leave: result.rows[0]
    });
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Error applying for leave',
      error: error.message
    });
  }
});

// Get my leaves (Employee)
router.get('/my', verifyToken, authorizeRoles('employee'), async (req, res) => {
  try {
    const { search, status } = req.query;
    const userId = req.user.id;

    let query = `
      SELECT 
        id, user_id, applied_date, from_date, to_date, leave_type, 
        status, paid_status, reason, created_at, updated_at,
        approved_by
      FROM leaves
      WHERE user_id = $1
    `;
    const params = [userId];
    let paramCount = 2;

    if (status) {
      query += ` AND status = $${paramCount++}`;
      params.push(status);
    }

    if (search) {
      query += ` AND (from_date::text ILIKE $${paramCount} OR to_date::text ILIKE $${paramCount} OR leave_type ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ' ORDER BY applied_date DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      leaves: result.rows
    });
  } catch (error) {
    console.error('Get my leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaves',
      error: error.message
    });
  }
});

// Get pending leaves (HR/Admin)
router.get('/pending', verifyToken, authorizeRoles('admin', 'hr'), async (req, res) => {
  try {
    const { search } = req.query;

    let query = `
      SELECT 
        l.id, l.user_id, l.applied_date, l.from_date, l.to_date, l.leave_type,
        l.status, l.paid_status, l.reason, l.created_at,
        u.name as employee_name, u.email as employee_email, u.department,
        u.hr_assigned_id
      FROM leaves l
      JOIN users u ON l.user_id = u.id
      WHERE l.status = 'pending'
    `;
    const params = [];
    let paramCount = 1;

    // HR can only see their assigned employees
    if (req.user.role === 'hr') {
      query += ` AND u.hr_assigned_id = $${paramCount++}`;
      params.push(req.user.id);
    }

    if (search) {
      query += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR l.from_date::text ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ' ORDER BY l.applied_date ASC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      leaves: result.rows
    });
  } catch (error) {
    console.error('Get pending leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending leaves',
      error: error.message
    });
  }
});

// Get all leaves (HR/Admin)
router.get('/all', verifyToken, authorizeRoles('admin', 'hr'), async (req, res) => {
  try {
    const { search, status, employee_id } = req.query;

    let query = `
      SELECT 
        l.id, l.user_id, l.applied_date, l.from_date, l.to_date, l.leave_type,
        l.status, l.paid_status, l.reason, l.created_at, l.updated_at,
        u.name as employee_name, u.email as employee_email, u.department,
        approver.name as approved_by_name
      FROM leaves l
      JOIN users u ON l.user_id = u.id
      LEFT JOIN users approver ON l.approved_by = approver.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // HR can only see their assigned employees
    if (req.user.role === 'hr') {
      query += ` AND u.hr_assigned_id = $${paramCount++}`;
      params.push(req.user.id);
    }

    if (employee_id) {
      query += ` AND l.user_id = $${paramCount++}`;
      params.push(employee_id);
    }

    if (status) {
      query += ` AND l.status = $${paramCount++}`;
      params.push(status);
    }

    if (search) {
      query += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR l.from_date::text ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ' ORDER BY l.applied_date DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      leaves: result.rows
    });
  } catch (error) {
    console.error('Get all leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaves',
      error: error.message
    });
  }
});

// Approve leave (HR/Admin)
router.put('/:id/approve', verifyToken, authorizeRoles('admin', 'hr'), async (req, res) => {
  try {
    const { id } = req.params;
    const { paid_status } = req.body;

    if (!paid_status || !['paid', 'unpaid'].includes(paid_status)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide paid_status (paid or unpaid)'
      });
    }

    // Get leave record
    const leaveResult = await pool.query(
      'SELECT user_id FROM leaves WHERE id = $1',
      [id]
    );

    if (leaveResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }

    const userId = leaveResult.rows[0].user_id;

    // HR can only approve their assigned employees
    if (req.user.role === 'hr') {
      const assignedCheck = await pool.query(
        'SELECT id FROM users WHERE id = $1 AND hr_assigned_id = $2',
        [userId, req.user.id]
      );
      if (assignedCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only approve leaves for your assigned employees.'
        });
      }
    }

    // Update leave
    await pool.query(
      `UPDATE leaves 
       SET status = 'approved', paid_status = $1, approved_by = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [paid_status, req.user.id, id]
    );

    // Get updated leave
    const result = await pool.query(
      `SELECT 
        l.id, l.user_id, l.applied_date, l.from_date, l.to_date, l.leave_type,
        l.status, l.paid_status, l.reason, l.created_at, l.updated_at,
        u.name as employee_name, u.email as employee_email
      FROM leaves l
      JOIN users u ON l.user_id = u.id
      WHERE l.id = $1`,
      [id]
    );

    res.json({
      success: true,
      message: 'Leave approved successfully',
      leave: result.rows[0]
    });
  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving leave',
      error: error.message
    });
  }
});

// Reject leave (HR/Admin)
router.put('/:id/reject', verifyToken, authorizeRoles('admin', 'hr'), async (req, res) => {
  try {
    const { id } = req.params;

    // Get leave record
    const leaveResult = await pool.query(
      'SELECT user_id FROM leaves WHERE id = $1',
      [id]
    );

    if (leaveResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }

    const userId = leaveResult.rows[0].user_id;

    // HR can only reject their assigned employees
    if (req.user.role === 'hr') {
      const assignedCheck = await pool.query(
        'SELECT id FROM users WHERE id = $1 AND hr_assigned_id = $2',
        [userId, req.user.id]
      );
      if (assignedCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only reject leaves for your assigned employees.'
        });
      }
    }

    // Update leave
    await pool.query(
      `UPDATE leaves 
       SET status = 'rejected', approved_by = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [req.user.id, id]
    );

    // Get updated leave
    const result = await pool.query(
      `SELECT 
        l.id, l.user_id, l.applied_date, l.from_date, l.to_date, l.leave_type,
        l.status, l.paid_status, l.reason, l.created_at, l.updated_at,
        u.name as employee_name, u.email as employee_email
      FROM leaves l
      JOIN users u ON l.user_id = u.id
      WHERE l.id = $1`,
      [id]
    );

    res.json({
      success: true,
      message: 'Leave rejected successfully',
      leave: result.rows[0]
    });
  } catch (error) {
    console.error('Reject leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting leave',
      error: error.message
    });
  }
});

// Get leave types (for dropdowns)
router.get('/types/list', verifyToken, async (req, res) => {
  try {
    const leaveTypes = [
      'Sick Leave',
      'Casual Leave',
      'Annual Leave',
      'Paid Leave',
      'Unpaid Leave'
    ];

    res.json({
      success: true,
      leaveTypes
    });
  } catch (error) {
    console.error('Get leave types error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave types',
      error: error.message
    });
  }
});

module.exports = router;


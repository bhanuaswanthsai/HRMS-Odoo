const express = require('express');
const { pool } = require('../config/database');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Check-in (Employee) - Simple check-in for today
router.post('/checkin', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTime = new Date().toTimeString().split(' ')[0]; // HH:MM:SS

    // Check if already checked in today
    const existing = await pool.query(
      'SELECT id, status FROM attendance WHERE user_id = $1 AND date = $2',
      [userId, today]
    );

    if (existing.rows.length > 0) {
      const existingRecord = existing.rows[0];
      // If already present, return success
      if (existingRecord.status === 'present') {
        return res.json({
          success: true,
          message: 'Already checked in today',
          attendance: existingRecord
        });
      }
      // Update if status is different
      const result = await pool.query(
        `UPDATE attendance SET status = 'present', check_in_time = $1 
         WHERE id = $2 
         RETURNING id, user_id, date, status, check_in_time, check_out_time, created_at`,
        [currentTime, existingRecord.id]
      );
      return res.json({
        success: true,
        message: 'Checked in successfully',
        attendance: result.rows[0]
      });
    }

    // Insert new attendance record
    const result = await pool.query(
      `INSERT INTO attendance (user_id, date, status, check_in_time)
       VALUES ($1, $2, 'present', $3)
       RETURNING id, user_id, date, status, check_in_time, check_out_time, created_at`,
      [userId, today, currentTime]
    );

    res.status(201).json({
      success: true,
      message: 'Checked in successfully',
      attendance: result.rows[0]
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking in',
      error: error.message
    });
  }
});

// Mark attendance (Employee)
router.post('/mark', verifyToken, authorizeRoles('employee'), async (req, res) => {
  try {
    const { date, status, check_in_time, check_out_time } = req.body;
    const userId = req.user.id;

    if (!date || !status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide date and status'
      });
    }

    // Check if attendance already marked for this date
    const existing = await pool.query(
      'SELECT id FROM attendance WHERE user_id = $1 AND date = $2',
      [userId, date]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this date'
      });
    }

    // Insert attendance
    const result = await pool.query(
      `INSERT INTO attendance (user_id, date, status, check_in_time, check_out_time)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, date, status, check_in_time, check_out_time, created_at`,
      [userId, date, status, check_in_time || null, check_out_time || null]
    );

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      attendance: result.rows[0]
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking attendance',
      error: error.message
    });
  }
});

// Get today's attendance status for all employees (HR/Admin Dashboard)
router.get('/today/status', verifyToken, authorizeRoles('admin', 'hr'), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    let query = `
      SELECT 
        u.id, u.name, u.email, u.login_id, u.role, u.department, u.avatar,
        u.first_name, u.last_name, u.company_name,
        a.status, a.check_in_time, a.check_out_time,
        CASE 
          WHEN a.status = 'present' THEN 'present'
          WHEN a.status = 'leave' THEN 'leave'
          WHEN a.status = 'absent' THEN 'absent'
          WHEN a.id IS NULL THEN 'not_checked_in'
          ELSE 'unknown'
        END as attendance_status
      FROM users u
      LEFT JOIN attendance a ON u.id = a.user_id AND a.date = $1
      WHERE u.role = 'employee' AND u.status = 'active'
    `;
    const params = [today];
    let paramCount = 2;

    // HR can only see their assigned employees
    if (req.user.role === 'hr') {
      query += ` AND u.hr_assigned_id = $${paramCount++}`;
      params.push(req.user.id);
    }

    query += ' ORDER BY u.name';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      employees: result.rows
    });
  } catch (error) {
    console.error('Get today attendance status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching today attendance status',
      error: error.message
    });
  }
});

// Get today's attendance status for current user
router.get('/today/my-status', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT id, user_id, date, status, check_in_time, check_out_time, created_at
       FROM attendance 
       WHERE user_id = $1 AND date = $2`,
      [userId, today]
    );

    res.json({
      success: true,
      attendance: result.rows[0] || null,
      checkedIn: result.rows.length > 0 && result.rows[0].status === 'present'
    });
  } catch (error) {
    console.error('Get today status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching today status',
      error: error.message
    });
  }
});

// Get attendance (Employee: own, HR/Admin: any user)
router.get('/:user_id?', verifyToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    const { search, start_date, end_date } = req.query;
    let targetUserId = user_id ? parseInt(user_id) : req.user.id;

    // Employees can only view their own attendance
    if (req.user.role === 'employee' && targetUserId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own attendance.'
      });
    }

    // HR can only view their assigned employees
    if (req.user.role === 'hr' && targetUserId !== req.user.id) {
      const assignedCheck = await pool.query(
        'SELECT id FROM users WHERE id = $1 AND hr_assigned_id = $2',
        [targetUserId, req.user.id]
      );
      if (assignedCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your assigned employees.'
        });
      }
    }

    let query = `
      SELECT 
        a.id, a.user_id, a.date, a.status, a.check_in_time, a.check_out_time, a.created_at,
        u.name as employee_name, u.email as employee_email
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE a.user_id = $1
    `;
    const params = [targetUserId];
    let paramCount = 2;

    if (start_date) {
      query += ` AND a.date >= $${paramCount++}`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND a.date <= $${paramCount++}`;
      params.push(end_date);
    }

    if (search) {
      query += ` AND (u.name ILIKE $${paramCount} OR a.date::text ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ' ORDER BY a.date DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      attendance: result.rows
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance',
      error: error.message
    });
  }
});

// Get attendance summary (HR/Admin)
router.get('/summary/all', verifyToken, authorizeRoles('admin', 'hr'), async (req, res) => {
  try {
    const { start_date, end_date, department } = req.query;

    let query = `
      SELECT 
        u.id, u.name, u.email, u.department,
        COUNT(a.id) as total_days,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
        COUNT(CASE WHEN a.status = 'leave' THEN 1 END) as leave_days
      FROM users u
      LEFT JOIN attendance a ON u.id = a.user_id
    `;
    const params = [];
    let paramCount = 1;
    const conditions = [];

    // HR can only see their assigned employees
    if (req.user.role === 'hr') {
      conditions.push(`u.hr_assigned_id = $${paramCount++}`);
      params.push(req.user.id);
    }

    if (department) {
      conditions.push(`u.department = $${paramCount++}`);
      params.push(department);
    }

    if (start_date) {
      conditions.push(`a.date >= $${paramCount++}`);
      params.push(start_date);
    }

    if (end_date) {
      conditions.push(`a.date <= $${paramCount++}`);
      params.push(end_date);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY u.id, u.name, u.email, u.department ORDER BY u.name';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      summary: result.rows
    });
  } catch (error) {
    console.error('Get attendance summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance summary',
      error: error.message
    });
  }
});

// Update attendance (HR/Admin - override, or Employee - check out)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, check_in_time, check_out_time, date } = req.body;

    // Get attendance record
    const attendanceResult = await pool.query(
      'SELECT user_id FROM attendance WHERE id = $1',
      [id]
    );

    if (attendanceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    const userId = attendanceResult.rows[0].user_id;

    // Employees can only update their own attendance (for check-out)
    if (req.user.role === 'employee' && userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own attendance.'
      });
    }

    // HR can only update their assigned employees
    if (req.user.role === 'hr') {
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

    const updateFields = [];
    const params = [];
    let paramCount = 1;

    if (status) {
      updateFields.push(`status = $${paramCount++}`);
      params.push(status);
    }
    if (check_in_time !== undefined) {
      updateFields.push(`check_in_time = $${paramCount++}`);
      params.push(check_in_time);
    }
    if (check_out_time !== undefined) {
      updateFields.push(`check_out_time = $${paramCount++}`);
      params.push(check_out_time);
    }
    if (date) {
      updateFields.push(`date = $${paramCount++}`);
      params.push(date);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    params.push(id);
    const query = `UPDATE attendance SET ${updateFields.join(', ')} WHERE id = $${paramCount}`;
    await pool.query(query, params);

    // Get updated record
    const result = await pool.query(
      `SELECT 
        a.id, a.user_id, a.date, a.status, a.check_in_time, a.check_out_time, a.created_at,
        u.name as employee_name
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = $1`,
      [id]
    );

    res.json({
      success: true,
      message: 'Attendance updated successfully',
      attendance: result.rows[0]
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating attendance',
      error: error.message
    });
  }
});

module.exports = router;


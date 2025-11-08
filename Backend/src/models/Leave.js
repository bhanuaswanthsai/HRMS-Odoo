import pool from '../config/database.js';

export const LeaveModel = {
  // Apply for leave
  create: async (leaveData) => {
    const { employee_id, leave_type, start_date, end_date, reason } = leaveData;
    const query = `
      INSERT INTO leaves (employee_id, leave_type, start_date, end_date, reason)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await pool.query(query, [employee_id, leave_type, start_date, end_date, reason]);
    return result.rows[0];
  },

  // Get employee's leaves
  getEmployeeLeaves: async (employee_id, filters = {}) => {
    let query = `
      SELECT l.*, e.employee_id as emp_id, e.department
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      WHERE l.employee_id = $1
    `;
    const params = [employee_id];
    let paramCount = 2;

    if (filters.status) {
      query += ` AND l.status = $${paramCount++}`;
      params.push(filters.status);
    }

    query += ` ORDER BY l.created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  },

  // Get pending leaves (for approvers)
  getPendingLeaves: async () => {
    const query = `
      SELECT 
        l.*,
        e.employee_id as emp_id,
        e.department,
        e.designation,
        u.email,
        u.profile_data
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE l.status = 'pending'
      ORDER BY l.created_at ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  // Approve leave
  approve: async (id, approved_by) => {
    const query = `
      UPDATE leaves 
      SET status = 'approved', approved_by = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [approved_by, id]);
    return result.rows[0];
  },

  // Reject leave
  reject: async (id, approved_by) => {
    const query = `
      UPDATE leaves 
      SET status = 'rejected', approved_by = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [approved_by, id]);
    return result.rows[0];
  },

  // Get leave by ID
  findById: async (id) => {
    const query = `
      SELECT l.*, e.employee_id as emp_id, e.department, u.email
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE l.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },
};

export const LeaveBalanceModel = {
  // Get leave balance
  getBalance: async (employee_id) => {
    const query = 'SELECT * FROM leave_balance WHERE employee_id = $1';
    const result = await pool.query(query, [employee_id]);
    return result.rows[0];
  },

  // Update leave balance
  updateBalance: async (employee_id, leaveType, days) => {
    const fieldMap = {
      casual_leave: 'casual_leave',
      sick_leave: 'sick_leave',
      earned_leave: 'earned_leave',
      paid_leave: 'paid_leave',
    };

    const field = fieldMap[leaveType];
    if (!field) {
      throw new Error('Invalid leave type');
    }

    const query = `
      UPDATE leave_balance 
      SET ${field} = ${field} - $1, updated_at = CURRENT_TIMESTAMP
      WHERE employee_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [days, employee_id]);
    return result.rows[0];
  },

  // Initialize leave balance
  initialize: async (employee_id, balances = {}) => {
    const query = `
      INSERT INTO leave_balance (employee_id, casual_leave, sick_leave, earned_leave, paid_leave)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (employee_id) DO NOTHING
      RETURNING *
    `;
    const result = await pool.query(query, [
      employee_id,
      balances.casual_leave || 12,
      balances.sick_leave || 10,
      balances.earned_leave || 15,
      balances.paid_leave || 5,
    ]);
    return result.rows[0];
  },
};


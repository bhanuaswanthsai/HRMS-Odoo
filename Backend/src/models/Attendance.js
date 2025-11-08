import pool from '../config/database.js';

export const AttendanceModel = {
  // Mark attendance (check-in/check-out)
  markAttendance: async (attendanceData) => {
    const { employee_id, date, check_in, check_out, status } = attendanceData;
    
    // Check if record exists
    const existing = await AttendanceModel.findByEmployeeAndDate(employee_id, date);
    
    if (existing) {
      // Update existing record
      const query = `
        UPDATE attendance 
        SET check_in = COALESCE($1, check_in),
            check_out = COALESCE($2, check_out),
            status = COALESCE($3, status),
            updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = $4 AND date = $5
        RETURNING *
      `;
      const result = await pool.query(query, [check_in, check_out, status, employee_id, date]);
      return result.rows[0];
    } else {
      // Create new record
      const query = `
        INSERT INTO attendance (employee_id, date, check_in, check_out, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const result = await pool.query(query, [employee_id, date, check_in, check_out, status || 'present']);
      return result.rows[0];
    }
  },

  // Get attendance by employee and date
  findByEmployeeAndDate: async (employee_id, date) => {
    const query = 'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2';
    const result = await pool.query(query, [employee_id, date]);
    return result.rows[0];
  },

  // Get employee's attendance logs
  getEmployeeLogs: async (employee_id, filters = {}) => {
    let query = `
      SELECT a.*, e.employee_id as emp_id, e.department, e.designation
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      WHERE a.employee_id = $1
    `;
    const params = [employee_id];
    let paramCount = 2;

    if (filters.start_date) {
      query += ` AND a.date >= $${paramCount++}`;
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      query += ` AND a.date <= $${paramCount++}`;
      params.push(filters.end_date);
    }

    query += ` ORDER BY a.date DESC`;

    if (filters.limit) {
      query += ` LIMIT $${paramCount++}`;
      params.push(filters.limit);
    }

    const result = await pool.query(query, params);
    return result.rows;
  },

  // Get attendance report for month/year
  getMonthlyReport: async (month, year) => {
    const query = `
      SELECT 
        a.*,
        e.employee_id as emp_id,
        e.department,
        e.designation,
        u.email,
        u.profile_data
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE EXTRACT(MONTH FROM a.date) = $1 
        AND EXTRACT(YEAR FROM a.date) = $2
      ORDER BY a.date DESC, e.employee_id
    `;
    const result = await pool.query(query, [month, year]);
    return result.rows;
  },

  // Auto-mark absent for employees without attendance
  markAbsentForDate: async (date) => {
    const query = `
      INSERT INTO attendance (employee_id, date, status)
      SELECT id, $1, 'absent'
      FROM employees
      WHERE status = 'active'
        AND id NOT IN (
          SELECT employee_id FROM attendance WHERE date = $1
        )
      ON CONFLICT (employee_id, date) DO NOTHING
      RETURNING *
    `;
    const result = await pool.query(query, [date]);
    return result.rows;
  },
};


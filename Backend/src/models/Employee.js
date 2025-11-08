import pool from '../config/database.js';

export const EmployeeModel = {
  // Create employee
  create: async (employeeData) => {
    const { user_id, employee_id, department, designation, joining_date, salary_structure } = employeeData;
    const query = `
      INSERT INTO employees (user_id, employee_id, department, designation, joining_date, salary_structure)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await pool.query(query, [
      user_id,
      employee_id,
      department,
      designation,
      joining_date,
      JSON.stringify(salary_structure || {}),
    ]);
    return result.rows[0];
  },

  // Get all employees with filters
  findAll: async (filters = {}) => {
    let query = `
      SELECT 
        e.id, e.employee_id, e.department, e.designation, e.joining_date, 
        e.salary_structure, e.status, e.created_at,
        u.id as user_id, u.email, u.role, u.profile_data
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filters.department) {
      query += ` AND e.department = $${paramCount++}`;
      params.push(filters.department);
    }

    if (filters.status) {
      query += ` AND e.status = $${paramCount++}`;
      params.push(filters.status);
    }

    if (filters.search) {
      query += ` AND (e.employee_id ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR u.profile_data->>'name' ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    query += ` ORDER BY e.created_at DESC`;

    if (filters.limit) {
      query += ` LIMIT $${paramCount++}`;
      params.push(filters.limit);
    }

    if (filters.offset) {
      query += ` OFFSET $${paramCount++}`;
      params.push(filters.offset);
    }

    const result = await pool.query(query, params);
    return result.rows;
  },

  // Get employee by ID
  findById: async (id) => {
    const query = `
      SELECT 
        e.*,
        u.id as user_id, u.email, u.role, u.profile_data
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE e.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Get employee by user_id
  findByUserId: async (user_id) => {
    const query = `
      SELECT 
        e.*,
        u.id as user_id, u.email, u.role, u.profile_data
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE e.user_id = $1
    `;
    const result = await pool.query(query, [user_id]);
    return result.rows[0];
  },

  // Update employee
  update: async (id, employeeData) => {
    const { department, designation, joining_date, salary_structure, status } = employeeData;
    const updates = [];
    const params = [];
    let paramCount = 1;

    if (department !== undefined) {
      updates.push(`department = $${paramCount++}`);
      params.push(department);
    }
    if (designation !== undefined) {
      updates.push(`designation = $${paramCount++}`);
      params.push(designation);
    }
    if (joining_date !== undefined) {
      updates.push(`joining_date = $${paramCount++}`);
      params.push(joining_date);
    }
    if (salary_structure !== undefined) {
      updates.push(`salary_structure = $${paramCount++}`);
      params.push(JSON.stringify(salary_structure));
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      params.push(status);
    }

    if (updates.length === 0) {
      return await EmployeeModel.findById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const query = `
      UPDATE employees 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    const result = await pool.query(query, params);
    return result.rows[0];
  },

  // Delete employee
  delete: async (id) => {
    const query = 'DELETE FROM employees WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },
};


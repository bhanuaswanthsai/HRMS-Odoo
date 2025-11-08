import pool from '../config/database.js';

export const UserModel = {
  // Create a new user
  create: async (userData) => {
    const { email, password, role, profile_data } = userData;
    const query = `
      INSERT INTO users (email, password, role, profile_data)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, role, profile_data, created_at
    `;
    const result = await pool.query(query, [email, password, role, JSON.stringify(profile_data || {})]);
    return result.rows[0];
  },

  // Find user by email
  findByEmail: async (email) => {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  },

  // Find user by ID
  findById: async (id) => {
    const query = 'SELECT id, email, role, profile_data, created_at, updated_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Update user profile
  updateProfile: async (id, profileData) => {
    const query = `
      UPDATE users 
      SET profile_data = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, email, role, profile_data, updated_at
    `;
    const result = await pool.query(query, [JSON.stringify(profileData), id]);
    return result.rows[0];
  },

  // Update password
  updatePassword: async (id, hashedPassword) => {
    const query = `
      UPDATE users 
      SET password = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, email
    `;
    const result = await pool.query(query, [hashedPassword, id]);
    return result.rows[0];
  },

  // Get user with employee details
  findWithEmployee: async (id) => {
    const query = `
      SELECT 
        u.id, u.email, u.role, u.profile_data, u.created_at, u.updated_at,
        e.id as employee_id, e.employee_id as emp_id, e.department, e.designation, 
        e.joining_date, e.salary_structure, e.status
      FROM users u
      LEFT JOIN employees e ON u.id = e.user_id
      WHERE u.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },
};


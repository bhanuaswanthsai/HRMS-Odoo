import pool from '../config/database.js';

export const PayrollModel = {
  // Process payroll for month/year
  processPayroll: async (payrollData) => {
    const { employee_id, month, year, basic_salary, allowances, deductions, net_salary } = payrollData;
    
    // Check if payroll already exists
    const existing = await PayrollModel.findByEmployeeAndPeriod(employee_id, month, year);
    
    if (existing) {
      // Update existing
      const query = `
        UPDATE payroll 
        SET basic_salary = $1,
            allowances = $2,
            deductions = $3,
            net_salary = $4,
            updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = $5 AND month = $6 AND year = $7
        RETURNING *
      `;
      const result = await pool.query(query, [
        basic_salary,
        JSON.stringify(allowances || {}),
        JSON.stringify(deductions || {}),
        net_salary,
        employee_id,
        month,
        year,
      ]);
      return result.rows[0];
    } else {
      // Create new
      const query = `
        INSERT INTO payroll (employee_id, month, year, basic_salary, allowances, deductions, net_salary)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const result = await pool.query(query, [
        employee_id,
        month,
        year,
        basic_salary,
        JSON.stringify(allowances || {}),
        JSON.stringify(deductions || {}),
        net_salary,
      ]);
      return result.rows[0];
    }
  },

  // Get payroll by employee and period
  findByEmployeeAndPeriod: async (employee_id, month, year) => {
    const query = 'SELECT * FROM payroll WHERE employee_id = $1 AND month = $2 AND year = $3';
    const result = await pool.query(query, [employee_id, month, year]);
    return result.rows[0];
  },

  // Get payroll report for month/year
  getMonthlyReport: async (month, year) => {
    const query = `
      SELECT 
        p.*,
        e.employee_id as emp_id,
        e.department,
        e.designation,
        u.email,
        u.profile_data
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE p.month = $1 AND p.year = $2
      ORDER BY e.employee_id
    `;
    const result = await pool.query(query, [month, year]);
    return result.rows;
  },

  // Update payroll
  update: async (id, updateData) => {
    const { basic_salary, allowances, deductions, net_salary } = updateData;
    const query = `
      UPDATE payroll 
      SET basic_salary = COALESCE($1, basic_salary),
          allowances = COALESCE($2, allowances),
          deductions = COALESCE($3, deductions),
          net_salary = COALESCE($4, net_salary),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
    const result = await pool.query(query, [
      basic_salary,
      allowances ? JSON.stringify(allowances) : null,
      deductions ? JSON.stringify(deductions) : null,
      net_salary,
      id,
    ]);
    return result.rows[0];
  },
};

export const PayslipModel = {
  // Generate payslip
  generate: async (payslipData) => {
    const { payroll_id, pdf_link } = payslipData;
    const query = `
      INSERT INTO payslips (payroll_id, pdf_link)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await pool.query(query, [payroll_id, pdf_link]);
    return result.rows[0];
  },

  // Get payslip by ID
  findById: async (id) => {
    const query = `
      SELECT 
        ps.*,
        p.*,
        e.employee_id as emp_id,
        e.department,
        e.designation,
        u.email,
        u.profile_data
      FROM payslips ps
      JOIN payroll p ON ps.payroll_id = p.id
      JOIN employees e ON p.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE ps.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },
};


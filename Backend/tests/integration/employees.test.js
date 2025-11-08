import request from 'supertest';
import app from '../../src/server.js';
import pool from '../../src/config/database.js';
import { generateToken } from '../../src/utils/jwt.js';

describe('Employees API', () => {
  let adminToken;
  let hrToken;
  let employeeToken;
  let testEmployeeId;

  beforeAll(async () => {
    // Create test users and get tokens
    const adminUser = { id: 'admin-123', email: 'admin@test.com', role: 'admin' };
    const hrUser = { id: 'hr-123', email: 'hr@test.com', role: 'hr_officer' };
    const empUser = { id: 'emp-123', email: 'emp@test.com', role: 'employee' };

    adminToken = generateToken(adminUser);
    hrToken = generateToken(hrUser);
    employeeToken = generateToken(empUser);
  });

  afterAll(async () => {
    // Clean up
    if (testEmployeeId) {
      await pool.query('DELETE FROM employees WHERE id = $1', [testEmployeeId]);
    }
    await pool.end();
  });

  describe('GET /api/employees', () => {
    it('should get employees list for authenticated user', async () => {
      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/employees');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/employees', () => {
    it('should create employee as admin', async () => {
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newemployee@test.com',
          password: 'password123',
          employee_id: 'EMP999',
          department: 'IT',
          designation: 'Developer',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      testEmployeeId = response.body.data.id;
    });

    it('should create employee as HR officer', async () => {
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          email: 'newemployee2@test.com',
          password: 'password123',
          employee_id: 'EMP998',
          department: 'HR',
          designation: 'Officer',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should reject employee creation by regular employee', async () => {
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          email: 'newemployee3@test.com',
          password: 'password123',
          employee_id: 'EMP997',
          department: 'IT',
          designation: 'Developer',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should reject employee creation with missing fields', async () => {
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'incomplete@test.com',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/employees/:id', () => {
    it('should delete employee as admin', async () => {
      // First create an employee
      const createResponse = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'todelete@test.com',
          password: 'password123',
          employee_id: 'EMPDEL',
          department: 'IT',
          designation: 'Developer',
        });

      const empId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/employees/${empId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject employee deletion by HR officer', async () => {
      const response = await request(app)
        .delete(`/api/employees/${testEmployeeId}`)
        .set('Authorization', `Bearer ${hrToken}`);

      expect(response.status).toBe(403);
    });

    it('should reject employee deletion by regular employee', async () => {
      const response = await request(app)
        .delete(`/api/employees/${testEmployeeId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(403);
    });
  });
});


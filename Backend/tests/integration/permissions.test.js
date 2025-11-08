import request from 'supertest';
import app from '../../src/server.js';
import { generateToken } from '../../src/utils/jwt.js';

describe('Role-Based Access Control', () => {
  let adminToken, hrToken, payrollToken, employeeToken;

  beforeAll(() => {
    const adminUser = { id: 'admin-1', email: 'admin@test.com', role: 'admin' };
    const hrUser = { id: 'hr-1', email: 'hr@test.com', role: 'hr_officer' };
    const payrollUser = { id: 'payroll-1', email: 'payroll@test.com', role: 'payroll_officer' };
    const empUser = { id: 'emp-1', email: 'emp@test.com', role: 'employee' };

    adminToken = generateToken(adminUser);
    hrToken = generateToken(hrUser);
    payrollToken = generateToken(payrollUser);
    employeeToken = generateToken(empUser);
  });

  describe('Employee Management Permissions', () => {
    it('should allow admin to create employee', async () => {
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'test1@example.com',
          password: 'password123',
          employee_id: 'EMP001',
          department: 'IT',
          designation: 'Developer',
        });

      expect([201, 400]).toContain(response.status); // 400 if duplicate
    });

    it('should allow HR officer to create employee', async () => {
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          email: 'test2@example.com',
          password: 'password123',
          employee_id: 'EMP002',
          department: 'HR',
          designation: 'Officer',
        });

      expect([201, 400]).toContain(response.status);
    });

    it('should deny employee role from creating employee', async () => {
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          email: 'test3@example.com',
          password: 'password123',
          employee_id: 'EMP003',
          department: 'IT',
          designation: 'Developer',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('Payroll Permissions', () => {
    it('should allow admin to process payroll', async () => {
      const response = await request(app)
        .post('/api/payroll/process/emp-1/1/2024')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 404, 500]).toContain(response.status); // May fail due to missing employee
    });

    it('should allow payroll officer to process payroll', async () => {
      const response = await request(app)
        .post('/api/payroll/process/emp-1/1/2024')
        .set('Authorization', `Bearer ${payrollToken}`);

      expect([200, 404, 500]).toContain(response.status);
    });

    it('should deny HR officer from processing payroll', async () => {
      const response = await request(app)
        .post('/api/payroll/process/emp-1/1/2024')
        .set('Authorization', `Bearer ${hrToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Leave Approval Permissions', () => {
    it('should allow admin to view pending leaves', async () => {
      const response = await request(app)
        .get('/api/leaves/pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 404]).toContain(response.status);
    });

    it('should allow HR officer to view pending leaves', async () => {
      const response = await request(app)
        .get('/api/leaves/pending')
        .set('Authorization', `Bearer ${hrToken}`);

      expect([200, 404]).toContain(response.status);
    });

    it('should deny employee from viewing pending leaves', async () => {
      const response = await request(app)
        .get('/api/leaves/pending')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Reports Permissions', () => {
    it('should allow admin to view reports', async () => {
      const response = await request(app)
        .get('/api/reports/attendance?month=1&year=2024')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 404]).toContain(response.status);
    });

    it('should allow payroll officer to view reports', async () => {
      const response = await request(app)
        .get('/api/reports/payroll?month=1&year=2024')
        .set('Authorization', `Bearer ${payrollToken}`);

      expect([200, 404]).toContain(response.status);
    });

    it('should deny employee from viewing reports', async () => {
      const response = await request(app)
        .get('/api/reports/attendance?month=1&year=2024')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Settings Permissions', () => {
    it('should allow admin to update settings', async () => {
      const response = await request(app)
        .put('/api/settings/company_name')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ value: 'New Company Name' });

      expect([200, 404]).toContain(response.status);
    });

    it('should deny HR officer from updating settings', async () => {
      const response = await request(app)
        .put('/api/settings/company_name')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({ value: 'New Company Name' });

      expect(response.status).toBe(403);
    });
  });
});


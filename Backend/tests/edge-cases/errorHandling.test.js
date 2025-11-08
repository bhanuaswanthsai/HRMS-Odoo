import request from 'supertest';
import app from '../../src/server.js';
import { generateToken } from '../../src/utils/jwt.js';

describe('Error Handling and Edge Cases', () => {
  let adminToken;

  beforeAll(() => {
    const adminUser = { id: 'admin-1', email: 'admin@test.com', role: 'admin' };
    adminToken = generateToken(adminUser);
  });

  describe('Invalid Input Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('invalid json');

      expect(response.status).toBe(400);
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          // Missing password
        });

      expect(response.status).toBe(400);
    });

    it('should handle extremely long input strings', async () => {
      const longString = 'a'.repeat(10000);
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: `${longString}@example.com`,
          password: 'password123',
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle SQL injection attempts', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: "'; DROP TABLE users; --",
          password: 'password123',
        });

      // Should not crash, should return error
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle minimum password length', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'boundary@test.com',
          password: '12345', // 5 characters, minimum is 6
        });

      expect(response.status).toBe(400);
    });

    it('should handle exact minimum password length', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'boundary2@test.com',
          password: '123456', // Exactly 6 characters
        });

      expect([201, 400]).toContain(response.status);
    });

    it('should handle invalid date formats', async () => {
      const response = await request(app)
        .post('/api/leaves/apply')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          leave_type: 'casual_leave',
          start_date: 'invalid-date',
          end_date: '2024-01-15',
          reason: 'Test',
        });

      expect(response.status).toBe(400);
    });

    it('should handle future dates in past context', async () => {
      const response = await request(app)
        .post('/api/leaves/apply')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          leave_type: 'casual_leave',
          start_date: '2024-01-15',
          end_date: '2024-01-10', // End before start
          reason: 'Test',
        });

      // Should validate date logic
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Resource Not Found', () => {
    it('should handle non-existent employee ID', async () => {
      const response = await request(app)
        .get('/api/employees/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('should handle non-existent payroll record', async () => {
      const response = await request(app)
        .get('/api/payroll/employee/non-existent/1/2024')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple simultaneous requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/health')
          .expect(200)
      );

      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Token Edge Cases', () => {
    it('should handle expired token format', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImV4cCI6MTYwOTQ1NjgwMH0.invalid';
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });

    it('should handle missing Bearer prefix', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'invalid-token');

      expect(response.status).toBe(401);
    });

    it('should handle empty token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer ');

      expect(response.status).toBe(401);
    });
  });

  describe('Large Payload Handling', () => {
    it('should handle large profile data', async () => {
      const largeProfile = {
        name: 'Test',
        data: Array(1000).fill({ key: 'value' }),
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ profile_data: largeProfile });

      // Should either succeed or return appropriate error
      expect([200, 400, 413]).toContain(response.status);
    });
  });
});


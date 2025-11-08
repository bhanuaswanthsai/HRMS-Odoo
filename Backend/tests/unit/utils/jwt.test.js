import { generateToken, verifyToken, decodeToken } from '../../../src/utils/jwt.js';

describe('JWT Utilities', () => {
  const testPayload = {
    id: '123',
    email: 'test@example.com',
    role: 'employee',
  };

  describe('generateToken', () => {
    it('should generate a valid token', () => {
      const token = generateToken(testPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    it('should generate different tokens for different payloads', () => {
      const token1 = generateToken({ ...testPayload, id: '1' });
      const token2 = generateToken({ ...testPayload, id: '2' });
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateToken(testPayload);
      const decoded = verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(testPayload.id);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.role).toBe(testPayload.role);
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const decoded = verifyToken(invalidToken);
      
      expect(decoded).toBeNull();
    });

    it('should return null for empty token', () => {
      const decoded = verifyToken('');
      
      expect(decoded).toBeNull();
    });
  });

  describe('decodeToken', () => {
    it('should decode a valid token', () => {
      const token = generateToken(testPayload);
      const decoded = decodeToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(testPayload.id);
    });

    it('should return null for invalid token', () => {
      const decoded = decodeToken('invalid');
      
      expect(decoded).toBeNull();
    });
  });
});


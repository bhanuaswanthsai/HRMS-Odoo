import { hashPassword, comparePassword } from '../../../src/utils/password.js';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hashed = await hashPassword(password);
      
      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(50);
    });

    it('should produce different hashes for same password', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'testPassword123';
      const hashed = await hashPassword(password);
      const result = await comparePassword(password, hashed);
      
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword';
      const hashed = await hashPassword(password);
      const result = await comparePassword(wrongPassword, hashed);
      
      expect(result).toBe(false);
    });

    it('should handle empty passwords', async () => {
      const hashed = await hashPassword('password');
      const result = await comparePassword('', hashed);
      
      expect(result).toBe(false);
    });
  });
});


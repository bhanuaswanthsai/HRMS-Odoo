import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../../services/authService.js';
import api from '../../services/api.js';

// Mock the API module
vi.mock('../../services/api.js', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    it('should login successfully and store token', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            token: 'test-token',
            user: { id: '1', email: 'test@example.com', role: 'employee' },
          },
        },
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'test-token');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify(mockResponse.data.data.user)
      );
    });

    it('should handle login failure', async () => {
      const mockResponse = {
        data: {
          success: false,
          message: 'Invalid credentials',
        },
      };

      api.post.mockResolvedValue(mockResponse);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result.success).toBe(false);
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should clear token and user from localStorage', () => {
      authService.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      localStorage.setItem('token', 'test-token');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when token does not exist', () => {
      localStorage.removeItem('token');
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getUser', () => {
    it('should return parsed user from localStorage', () => {
      const user = { id: '1', email: 'test@example.com' };
      localStorage.setItem('user', JSON.stringify(user));

      expect(authService.getUser()).toEqual(user);
    });

    it('should return null when user does not exist', () => {
      localStorage.removeItem('user');
      expect(authService.getUser()).toBeNull();
    });
  });
});


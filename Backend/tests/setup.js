// Test setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DB_NAME = process.env.DB_NAME || 'hrms_test';

// Mock console methods to reduce noise in tests (optional)
// Uncomment if you want to suppress console output in tests
// global.console = {
//   ...console,
//   log: () => {},
//   debug: () => {},
//   info: () => {},
//   warn: () => {},
//   error: () => {},
// };


# Testing Guide - HRMS

## Overview

This document provides a comprehensive guide to testing the HRMS application, covering unit tests, integration tests, UI tests, role-based access testing, and edge case handling.

## Test Setup

### Backend Testing (Jest)

**Configuration**: `Backend/jest.config.js`

**Dependencies**:
- `jest` - Testing framework
- `supertest` - HTTP assertions
- `@types/jest` - TypeScript types

**Run Tests**:
```bash
cd Backend
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage
npm run test:integration    # Only integration tests
```

### Frontend Testing (Vitest)

**Configuration**: `Frontend/vitest.config.js`

**Dependencies**:
- `vitest` - Testing framework
- `@testing-library/react` - React testing utilities
- `@testing-library/jest-dom` - DOM matchers
- `jsdom` - DOM environment

**Run Tests**:
```bash
cd Frontend
npm test                    # Run all tests
npm run test:ui             # With UI
npm run test:coverage       # With coverage
```

## Test Categories

### 1. Unit Tests

**Purpose**: Test individual functions and utilities in isolation.

**Location**: `Backend/tests/unit/`, `Frontend/src/tests/`

**Coverage**:
- ✅ Password hashing and comparison
- ✅ JWT token generation and verification
- ✅ Payroll calculation logic
- ✅ Permission checking utilities
- ✅ Frontend permission utilities
- ✅ Service functions

**Example**:
```javascript
describe('Password Utilities', () => {
  it('should hash a password', async () => {
    const hashed = await hashPassword('password123');
    expect(hashed).toBeDefined();
    expect(hashed).not.toBe('password123');
  });
});
```

### 2. Integration Tests

**Purpose**: Test API endpoints and database interactions.

**Location**: `Backend/tests/integration/`

**Coverage**:
- ✅ Authentication endpoints (register, login, profile)
- ✅ Employee CRUD operations
- ✅ Attendance management
- ✅ Leave management
- ✅ Payroll processing
- ✅ Report generation

**Example**:
```javascript
describe('POST /api/auth/register', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123' });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

### 3. Role-Based Access Tests

**Purpose**: Verify permission enforcement across different user roles.

**Location**: `Backend/tests/integration/permissions.test.js`

**Test Scenarios**:
- ✅ Admin can access all features
- ✅ HR Officer can manage employees and leaves
- ✅ Payroll Officer can process payroll and view reports
- ✅ Employee can only view own data
- ✅ Unauthorized access is denied

**Example**:
```javascript
describe('Employee Management Permissions', () => {
  it('should allow admin to create employee', async () => {
    const response = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(employeeData);
    
    expect(response.status).toBe(201);
  });

  it('should deny employee role from creating employee', async () => {
    const response = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send(employeeData);
    
    expect(response.status).toBe(403);
  });
});
```

### 4. Edge Case Tests

**Purpose**: Test error handling and boundary conditions.

**Location**: `Backend/tests/edge-cases/`

**Coverage**:
- ✅ Invalid input handling
- ✅ Missing required fields
- ✅ Boundary conditions (min/max values)
- ✅ Resource not found scenarios
- ✅ Concurrent operations
- ✅ Token edge cases (expired, invalid, missing)
- ✅ Large payload handling
- ✅ SQL injection attempts

**Example**:
```javascript
describe('Error Handling', () => {
  it('should handle malformed JSON', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send('invalid json');
    
    expect(response.status).toBe(400);
  });

  it('should handle non-existent employee ID', async () => {
    const response = await request(app)
      .get('/api/employees/non-existent-id')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(404);
  });
});
```

### 5. UI Tests (Frontend)

**Purpose**: Test React components and user interactions.

**Location**: `Frontend/src/tests/`

**Coverage**:
- ✅ Component rendering
- ✅ Permission-based component visibility
- ✅ Service function mocking
- ✅ User interactions
- ✅ Form validation

**Example**:
```javascript
describe('PermissionGate Component', () => {
  it('should render children when permission is granted', () => {
    render(
      <PermissionGate permission="EMPLOYEE_CREATE">
        <div>Protected Content</div>
      </PermissionGate>
    );
    
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
```

## Test Coverage Goals

| Category | Target Coverage |
|----------|----------------|
| Unit Tests | > 80% |
| Integration Tests | All API endpoints |
| Role-Based Tests | All permission combinations |
| Edge Cases | Critical error scenarios |
| UI Tests | Core components |

## Running Specific Tests

### Backend

```bash
# Single test file
npm test -- auth.test.js

# Tests matching pattern
npm test -- --testNamePattern="should login"

# With verbose output
npm test -- --verbose
```

### Frontend

```bash
# Single test file
npm test -- permissions.test.js

# Tests matching pattern
npm test -- -t "should return true"
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd Backend && npm install && npm test
      - run: cd Frontend && npm install && npm test
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Clean Setup/Teardown**: Clean up test data
3. **Descriptive Names**: Clear test descriptions
4. **AAA Pattern**: Arrange-Act-Assert structure
5. **Mock External Services**: Don't hit real APIs
6. **Test Edge Cases**: Boundary conditions
7. **Error Scenarios**: Test error handling
8. **Coverage Reports**: Monitor test coverage

## Common Test Patterns

### Testing Async Functions

```javascript
it('should handle async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Testing API Endpoints

```javascript
it('should return 200 for valid request', async () => {
  const response = await request(app)
    .get('/api/endpoint')
    .set('Authorization', `Bearer ${token}`);
  
  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
});
```

### Testing Permissions

```javascript
it('should deny access without permission', async () => {
  const response = await request(app)
    .post('/api/protected')
    .set('Authorization', `Bearer ${employeeToken}`);
  
  expect(response.status).toBe(403);
});
```

### Mocking Dependencies

```javascript
vi.mock('../services/api.js', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));
```

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure test database is configured
2. **Token Expiration**: Use fresh tokens in tests
3. **Async Timing**: Use proper async/await
4. **Mock Cleanup**: Clear mocks between tests
5. **Environment Variables**: Set test env variables

## Next Steps

- [ ] Add E2E tests with Playwright/Cypress
- [ ] Add performance tests
- [ ] Add load testing
- [ ] Add security testing
- [ ] Set up CI/CD pipeline

---

**Testing is an ongoing process. Keep adding tests as you add features!**


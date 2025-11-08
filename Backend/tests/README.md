# Testing Documentation

## Test Structure

```
Backend/tests/
├── setup.js                    # Test configuration
├── __mocks__/                  # Mock implementations
│   └── database.js
├── unit/                       # Unit tests
│   └── utils/
│       ├── password.test.js
│       ├── jwt.test.js
│       ├── payrollCalculator.test.js
│       └── permissions.test.js
├── integration/                # Integration tests
│   ├── auth.test.js
│   ├── employees.test.js
│   └── permissions.test.js
└── edge-cases/                 # Edge case tests
    └── errorHandling.test.js
```

## Running Tests

### Backend Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only integration tests
npm run test:integration
```

### Frontend Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Categories

### Unit Tests
- **Password Utilities**: Hashing and comparison
- **JWT Utilities**: Token generation and verification
- **Payroll Calculator**: Salary calculations
- **Permissions**: Role-based access control

### Integration Tests
- **Authentication API**: Register, login, profile
- **Employee API**: CRUD operations with permissions
- **Role-Based Access**: Permission enforcement

### Edge Case Tests
- **Error Handling**: Invalid inputs, boundary conditions
- **Resource Not Found**: Non-existent resources
- **Concurrent Operations**: Multiple simultaneous requests
- **Token Edge Cases**: Expired, invalid, missing tokens

## Test Coverage Goals

- **Unit Tests**: > 80% coverage
- **Integration Tests**: All API endpoints
- **Edge Cases**: Critical error scenarios

## Writing New Tests

### Unit Test Example

```javascript
import { functionToTest } from '../../src/utils/module.js';

describe('Module Name', () => {
  it('should do something', () => {
    const result = functionToTest(input);
    expect(result).toBe(expected);
  });
});
```

### Integration Test Example

```javascript
import request from 'supertest';
import app from '../../src/server.js';

describe('API Endpoint', () => {
  it('should handle request', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
  });
});
```

## Mocking

- Database queries are mocked in integration tests
- External services should be mocked
- Use `__mocks__` directory for shared mocks

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Clean up test data after tests
3. **Descriptive Names**: Use clear test descriptions
4. **Arrange-Act-Assert**: Structure tests clearly
5. **Edge Cases**: Test boundary conditions
6. **Error Cases**: Test error handling


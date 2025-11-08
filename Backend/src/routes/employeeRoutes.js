import express from 'express';
import { body } from 'express-validator';
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../controllers/employeeController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissions.js';

const router = express.Router();

// Validation rules
const createEmployeeValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('employee_id').notEmpty().withMessage('Employee ID is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('designation').notEmpty().withMessage('Designation is required'),
];

// Routes with permission checks
router.get('/', authenticate, getAllEmployees);
router.get('/:id', authenticate, getEmployeeById);
router.post('/', authenticate, checkPermission('EMPLOYEE_CREATE'), createEmployeeValidation, createEmployee);
router.put('/:id', authenticate, checkPermission('EMPLOYEE_UPDATE'), updateEmployee);
router.delete('/:id', authenticate, checkPermission('EMPLOYEE_DELETE'), deleteEmployee);

export default router;


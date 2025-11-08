import express from 'express';
import { body } from 'express-validator';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  changeUserPassword,
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissions.js';

const router = express.Router();

// Validation rules
const createUserValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .isIn(['admin', 'hr_officer', 'payroll_officer', 'employee'])
    .withMessage('Invalid role. Must be one of: admin, hr_officer, payroll_officer, employee'),
];

const updateUserValidation = [
  body('role')
    .optional()
    .isIn(['admin', 'hr_officer', 'payroll_officer', 'employee'])
    .withMessage('Invalid role'),
];

const changePasswordValidation = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

// Routes - All require admin permission
router.get('/', authenticate, checkPermission('USER_MANAGEMENT'), getAllUsers);
router.post('/', authenticate, checkPermission('USER_MANAGEMENT'), createUserValidation, createUser);
router.put('/:id', authenticate, checkPermission('USER_MANAGEMENT'), updateUserValidation, updateUser);
router.delete('/:id', authenticate, checkPermission('USER_MANAGEMENT'), deleteUser);
router.put('/:id/password', authenticate, checkPermission('USER_MANAGEMENT'), changePasswordValidation, changeUserPassword);

export default router;


import express from 'express';
import { body } from 'express-validator';
import {
  applyLeave,
  getMyLeaves,
  getPendingLeaves,
  approveLeave,
  rejectLeave,
  getLeaveBalance,
} from '../controllers/leaveController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissions.js';

const router = express.Router();

const applyLeaveValidation = [
  body('leave_type').isIn(['casual_leave', 'sick_leave', 'earned_leave', 'paid_leave']).withMessage('Invalid leave type'),
  body('start_date').isISO8601().withMessage('Invalid start date'),
  body('end_date').isISO8601().withMessage('Invalid end date'),
  body('reason').notEmpty().withMessage('Reason is required'),
];

router.post('/apply', authenticate, applyLeaveValidation, applyLeave);
router.get('/my-leaves', authenticate, getMyLeaves);
router.get('/pending', authenticate, checkPermission('LEAVE_APPROVE'), getPendingLeaves);
router.put('/:id/approve', authenticate, checkPermission('LEAVE_APPROVE'), approveLeave);
router.put('/:id/reject', authenticate, checkPermission('LEAVE_APPROVE'), rejectLeave);
router.get('/balance', authenticate, getLeaveBalance);

export default router;


import express from 'express';
import { body } from 'express-validator';
import {
  markAttendance,
  getMyLogs,
  getEmployeeAttendance,
  getAttendanceReport,
} from '../controllers/attendanceController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissions.js';

const router = express.Router();

const markAttendanceValidation = [
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('check_in').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format'),
  body('check_out').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format'),
];

router.post('/mark', authenticate, markAttendanceValidation, markAttendance);
router.get('/my-logs', authenticate, getMyLogs);
router.get('/employee/:id', authenticate, checkPermission('ATTENDANCE_VIEW_ALL'), getEmployeeAttendance);
router.get('/report/:month/:year', authenticate, checkPermission('ATTENDANCE_VIEW_ALL'), getAttendanceReport);

export default router;


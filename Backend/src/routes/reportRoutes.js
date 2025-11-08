import express from 'express';
import {
  generateAttendanceReport,
  generatePayrollReport,
  generateLeaveReport,
  emailReport,
} from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissions.js';

const router = express.Router();

router.get('/attendance', authenticate, checkPermission('REPORTS_VIEW'), generateAttendanceReport);
router.get('/payroll', authenticate, checkPermission('REPORTS_VIEW'), generatePayrollReport);
router.get('/leave', authenticate, checkPermission('REPORTS_VIEW'), generateLeaveReport);
router.post('/email', authenticate, checkPermission('REPORTS_VIEW'), emailReport);

export default router;


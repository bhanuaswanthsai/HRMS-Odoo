import express from 'express';
import { getAdminDashboard, getEmployeeDashboard } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissions.js';

const router = express.Router();

router.get('/admin', authenticate, checkPermission('ATTENDANCE_VIEW_ALL'), getAdminDashboard);
router.get('/employee', authenticate, getEmployeeDashboard);

export default router;


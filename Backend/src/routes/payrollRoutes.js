import express from 'express';
import {
  processPayroll,
  getEmployeePayroll,
  getPayslip,
  updatePayroll,
  getPayrollReport,
} from '../controllers/payrollController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissions.js';

const router = express.Router();

router.post('/process/:employee_id/:month/:year', authenticate, checkPermission('PAYROLL_PROCESS'), processPayroll);
router.get('/employee/:id/:month/:year', authenticate, getEmployeePayroll);
router.get('/payslips/:id', authenticate, getPayslip);
router.put('/:id/edit', authenticate, checkPermission('PAYROLL_PROCESS'), updatePayroll);
router.get('/reports/:month/:year', authenticate, checkPermission('REPORTS_VIEW'), getPayrollReport);

export default router;


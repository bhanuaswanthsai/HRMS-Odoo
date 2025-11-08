import express from 'express';
import { body } from 'express-validator';
import {
  getSettings,
  getSetting,
  updateSetting,
  getEmailTemplates,
  updateEmailTemplate,
} from '../controllers/settingsController.js';
import { authenticate } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissions.js';

const router = express.Router();

router.get('/', authenticate, getSettings);
router.get('/:key', authenticate, getSetting);
router.put('/:key', authenticate, checkPermission('SETTINGS_MANAGE'), updateSetting);
router.get('/email-templates', authenticate, checkPermission('SETTINGS_MANAGE'), getEmailTemplates);
router.put('/email-templates/:name', authenticate, checkPermission('SETTINGS_MANAGE'), updateEmailTemplate);

export default router;


import { SettingsModel, EmailTemplateModel } from '../models/Settings.js';
import { validationResult } from 'express-validator';

export const getSettings = async (req, res) => {
  try {
    const { category } = req.query;

    let settings;
    if (category) {
      settings = await SettingsModel.getByCategory(category);
    } else {
      settings = await SettingsModel.getAll();
    }

    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await SettingsModel.getByKey(key);

    if (!setting) {
      return res.status(404).json({ success: false, message: 'Setting not found' });
    }

    res.json({ success: true, data: setting });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateSetting = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { key } = req.params;
    const { value, description } = req.body;

    const setting = await SettingsModel.update(key, value, description);

    if (!setting) {
      return res.status(404).json({ success: false, message: 'Setting not found' });
    }

    res.json({
      success: true,
      message: 'Setting updated successfully',
      data: setting,
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getEmailTemplates = async (req, res) => {
  try {
    const templates = await EmailTemplateModel.getAll();
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('Get email templates error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateEmailTemplate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name } = req.params;
    const { subject, body, variables } = req.body;

    const template = await EmailTemplateModel.update(name, { subject, body, variables });

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    res.json({
      success: true,
      message: 'Email template updated successfully',
      data: template,
    });
  } catch (error) {
    console.error('Update email template error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


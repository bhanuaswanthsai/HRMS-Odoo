import pool from '../config/database.js';

export const SettingsModel = {
  // Get setting by key
  getByKey: async (key) => {
    const query = 'SELECT * FROM settings WHERE key = $1';
    const result = await pool.query(query, [key]);
    return result.rows[0];
  },

  // Get all settings by category
  getByCategory: async (category) => {
    const query = 'SELECT * FROM settings WHERE category = $1 ORDER BY key';
    const result = await pool.query(query, [category]);
    return result.rows;
  },

  // Get all settings
  getAll: async () => {
    const query = 'SELECT * FROM settings ORDER BY category, key';
    const result = await pool.query(query);
    return result.rows;
  },

  // Update setting
  update: async (key, value, description = null) => {
    const query = `
      UPDATE settings 
      SET value = $1, description = COALESCE($2, description), updated_at = CURRENT_TIMESTAMP
      WHERE key = $3
      RETURNING *
    `;
    const result = await pool.query(query, [JSON.stringify(value), description, key]);
    return result.rows[0];
  },

  // Create setting
  create: async (settingData) => {
    const { key, value, category, description } = settingData;
    const query = `
      INSERT INTO settings (key, value, category, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await pool.query(query, [key, JSON.stringify(value), category || 'general', description]);
    return result.rows[0];
  },
};

export const EmailTemplateModel = {
  // Get template by name
  getByName: async (name) => {
    const query = 'SELECT * FROM email_templates WHERE name = $1';
    const result = await pool.query(query, [name]);
    return result.rows[0];
  },

  // Get all templates
  getAll: async () => {
    const query = 'SELECT * FROM email_templates ORDER BY name';
    const result = await pool.query(query);
    return result.rows;
  },

  // Update template
  update: async (name, templateData) => {
    const { subject, body, variables } = templateData;
    const query = `
      UPDATE email_templates 
      SET subject = $1, body = $2, variables = $3, updated_at = CURRENT_TIMESTAMP
      WHERE name = $4
      RETURNING *
    `;
    const result = await pool.query(query, [subject, body, JSON.stringify(variables || []), name]);
    return result.rows[0];
  },
};

export const NotificationModel = {
  // Create notification
  create: async (notificationData) => {
    const { user_id, type, title, message } = notificationData;
    const query = `
      INSERT INTO notifications (user_id, type, title, message)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await pool.query(query, [user_id, type, title, message]);
    return result.rows[0];
  },

  // Get user notifications
  getUserNotifications: async (user_id, filters = {}) => {
    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const params = [user_id];
    let paramCount = 2;

    if (filters.read !== undefined) {
      query += ` AND read = $${paramCount++}`;
      params.push(filters.read);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramCount++}`;
      params.push(filters.limit);
    }

    const result = await pool.query(query, params);
    return result.rows;
  },

  // Mark as read
  markAsRead: async (id, user_id) => {
    const query = `
      UPDATE notifications 
      SET read = TRUE 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [id, user_id]);
    return result.rows[0];
  },

  // Mark all as read
  markAllAsRead: async (user_id) => {
    const query = `
      UPDATE notifications 
      SET read = TRUE 
      WHERE user_id = $1 AND read = FALSE
      RETURNING *
    `;
    const result = await pool.query(query, [user_id]);
    return result.rows;
  },
};


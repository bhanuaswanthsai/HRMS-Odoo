# Email Configuration Setup

This guide will help you configure email sending functionality for the HRMS system using Nodemailer.

## Prerequisites

- Node.js and npm installed
- An email account (Gmail, Outlook, Yahoo, or custom SMTP server)
- For Gmail: You need to enable 2-Factor Authentication and create an App Password

## Environment Variables

Add the following environment variables to your `.env` file in the `backend` directory:

```env
# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173

# Email Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password-here
```

## Gmail Setup (Recommended for Development)

1. **Enable 2-Factor Authentication**
   - Go to your Google Account settings
   - Navigate to Security
   - Enable 2-Step Verification

2. **Create an App Password**
   - Go to: Google Account > Security > 2-Step Verification > App passwords
   - Select "Mail" and "Other (Custom name)"
   - Enter "HRMS" as the app name
   - Copy the 16-character password generated

3. **Update .env file**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-character-app-password
   ```

## Other Email Providers

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

### Yahoo
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yahoo.com
SMTP_PASSWORD=your-app-password
```

### Custom SMTP Server
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yourdomain.com
SMTP_PASSWORD=your-password
```

For SSL/TLS on port 465:
```env
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@yourdomain.com
SMTP_PASSWORD=your-password
```

## Testing Email Configuration

After setting up your `.env` file, restart your backend server. The email service will verify the configuration on startup.

If you see the message "Email service is ready to send emails" in your server logs, the configuration is correct.

## What Emails Are Sent?

When a new employee is created:
- **Welcome Email** with:
  - Login ID
  - Temporary Password
  - Portal login URL
  - Instructions to change password on first login
  - Security notice

## Troubleshooting

### Error: "Invalid login"
- For Gmail: Make sure you're using an App Password, not your regular password
- Check that 2-Factor Authentication is enabled

### Error: "Connection timeout"
- Check your firewall settings
- Verify SMTP_HOST and SMTP_PORT are correct
- Try using SMTP_SECURE=true for port 465

### Error: "Authentication failed"
- Double-check your SMTP_USER and SMTP_PASSWORD
- For Gmail: Ensure you're using the App Password, not your account password
- Make sure your email account allows "Less secure app access" (if applicable)

### Emails not being received
- Check spam/junk folder
- Verify the recipient email address is correct
- Check server logs for error messages
- Verify SMTP configuration is correct

## Security Notes

- Never commit your `.env` file to version control
- Use App Passwords instead of your main account password
- Keep your SMTP credentials secure
- Consider using environment-specific email accounts for production

## Production Considerations

- Use a professional email service (SendGrid, Mailgun, AWS SES, etc.) for production
- Set up proper email templates and branding
- Monitor email delivery rates
- Implement email queue system for high volume
- Set up email bounce handling
- Configure SPF, DKIM, and DMARC records for your domain


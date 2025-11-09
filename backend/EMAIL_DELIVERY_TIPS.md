# Email Delivery Tips for Employees

## ✅ Your Email Service is Working!

The test confirms emails are being sent successfully. However, employees might not receive them due to:

## 🔍 Common Reasons Employees Don't Receive Emails

### 1. **Email Provider Filtering**
Different email providers (like `srmap.edu.in`, `outlook.com`, etc.) may:
- Filter emails more aggressively than Gmail
- Block emails from unknown senders
- Mark emails as spam automatically

### 2. **Spam/Junk Folder**
**ALWAYS check the spam/junk folder!** This is the #1 reason emails aren't seen.

### 3. **Email Delivery Delays**
- Can take **5-15 minutes** or longer
- Some providers delay emails by hours
- Educational institution emails often have longer delays

### 4. **Email Address Issues**
- Typo in email address
- Email address doesn't exist
- Email account is inactive

## 📋 Checklist for Employee Email Issues

When an employee says they didn't receive the email:

- [ ] **Check server console** - Look for "✅ Welcome email sent successfully!"
- [ ] **Verify email address** - Make sure it's correct (no typos)
- [ ] **Ask employee to check spam/junk folder**
- [ ] **Wait 15-30 minutes** - Email delivery can be delayed
- [ ] **Check all email folders** - Inbox, Spam, Junk, Trash, All Mail
- [ ] **Try resending** - Use the debug script to resend
- [ ] **Verify email exists** - Make sure the email address is active

## 🧪 How to Resend Email to an Employee

### Option 1: Use Debug Script
```bash
cd backend
node debug-email.js employee@example.com
```

### Option 2: Check Server Logs
When creating an employee, watch for:
```
📧 ========================================
📧 SENDING WELCOME EMAIL TO EMPLOYEE
📧 ========================================
📧 Employee Email: employee@example.com
...
✅ Welcome email sent successfully to: employee@example.com
```

If you see this, the email WAS sent - check spam folder!

## 🎯 For Different Email Providers

### Gmail (gmail.com)
- Usually receives emails quickly
- Check Spam folder
- Check All Mail

### Educational Institutions (edu.in, edu, etc.)
- Often have strict spam filters
- May delay emails significantly
- Check spam folder thoroughly
- May need to whitelist sender

### Outlook/Hotmail
- Aggressive spam filtering
- Check Junk folder
- May need to add sender to contacts

### Corporate Emails
- May be blocked by company firewall
- Check with IT department
- May need to whitelist sender

## 🔧 Troubleshooting Steps

1. **Check server console** - Did email send successfully?
   - Look for: `✅ Welcome email sent successfully!`
   - If yes → Email was sent, check spam folder
   - If no → Check error message

2. **Verify email address** - Is it correct?
   - No typos?
   - Email exists?
   - Email is active?

3. **Check spam folder** - Most common issue!
   - Ask employee to check spam/junk
   - Check all email folders

4. **Wait and retry** - Delivery delays
   - Wait 15-30 minutes
   - Check again later

5. **Resend email** - Use debug script
   ```bash
   node debug-email.js employee@example.com
   ```

## 📧 Alternative: Manual Credential Sharing

If email delivery continues to fail, you can:
1. Check the server console for the Login ID and Password
2. Manually share credentials with the employee
3. The employee can still log in and change their password

## 🆘 Still Not Working?

If emails consistently fail:
1. Check server logs for specific error messages
2. Try different email provider for testing
3. Contact email provider support
4. Consider using a professional email service (SendGrid, Mailgun, etc.)


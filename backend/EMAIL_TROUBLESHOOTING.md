# Email Troubleshooting Guide

## ✅ Good News: Your Email Configuration is Working!

The test shows that emails ARE being sent successfully:
- ✅ SMTP connection: Working
- ✅ Authentication: Working (App Password is correct)
- ✅ Email sending: Working (Gmail accepts the emails)

## 🔍 Why You Might Not See the Email

### 1. Check Gmail Filters
Gmail might be filtering your emails. Check:
- **Spam/Junk folder** - Most common issue
- **All Mail** - Sometimes emails go here first
- **Promotions tab** - Gmail might categorize it as promotional
- **Social tab** - Check all inbox tabs

### 2. Gmail Delivery Delays
- Gmail can delay emails by **5-15 minutes** or more
- Wait at least **10-15 minutes** after creating an employee
- Check back later if you don't see it immediately

### 3. Check the Correct Email Address
When creating an employee, make sure:
- The email address is **correct** (no typos)
- The email address **exists** (not a fake/test email)
- You're checking the **employee's email**, not your admin email

### 4. Gmail Security Settings
Gmail might be blocking emails from your own account. Check:
- Go to: https://myaccount.google.com/security
- Check "Less secure app access" (though this shouldn't be needed with App Password)
- Check if there are any security alerts

## 🧪 How to Test

### Test 1: Send Test Email to Yourself
```bash
cd backend
node test-email-direct.js
```
Check your inbox (`adityajs2006@gmail.com`) for the test email.

### Test 2: Send Test Email to Employee Email
```bash
cd backend
node debug-email.js employee@example.com
```
Replace `employee@example.com` with the actual employee email.

### Test 3: Check Server Logs
When creating an employee, check your server console for:
```
✅ Welcome email sent successfully!
   Message ID: <...>
   To: employee@example.com
```

If you see this, the email WAS sent successfully.

## 🔍 Check What Email Was Used

### Option 1: Check Database
```bash
cd backend
node check-employee-email.js
```
This will show you the email addresses of recently created employees.

### Option 2: Check Server Console
When you create an employee, look for this in your server console:
```
Attempting to send welcome email to: <email-address>
✅ Welcome email sent successfully!
```

## 🛠️ Common Issues and Solutions

### Issue: Email sent but not received
**Solution:**
1. Check spam folder ✅
2. Wait 10-15 minutes ✅
3. Check all Gmail tabs (Primary, Social, Promotions) ✅
4. Verify email address is correct ✅

### Issue: Different email address used
**Solution:**
- When creating employee, double-check the email field
- Make sure you're checking the employee's email, not your admin email

### Issue: Gmail blocking emails
**Solution:**
- Gmail might block emails sent to the same address (your admin email)
- Try creating an employee with a **different email address**
- Use a real email address (not a test/fake one)

## 📧 Test with Different Email

Try creating an employee with:
1. **Your personal email** (different from admin email)
2. **A colleague's email**
3. **A test email service** like Mailtrap or Ethereal

## 🎯 Quick Checklist

- [ ] Check spam/junk folder
- [ ] Wait 10-15 minutes
- [ ] Check all Gmail tabs (Primary, Social, Promotions, Updates)
- [ ] Verify email address is correct when creating employee
- [ ] Check server console for email sending logs
- [ ] Try creating employee with different email address
- [ ] Check if email address exists (not fake/test)

## 🆘 Still Not Working?

If emails are still not received after checking everything:

1. **Check server logs** - Look for any error messages
2. **Try different email provider** - Use Outlook, Yahoo, or custom SMTP
3. **Check Gmail activity** - Go to https://myaccount.google.com/security and check recent activity
4. **Contact support** - The email might be stuck in Gmail's system

## 📝 Important Notes

- **Email delivery is not instant** - Can take 5-15 minutes
- **Gmail filters aggressively** - Always check spam folder
- **Use real email addresses** - Fake emails won't work
- **Check server logs** - They tell you if email was sent successfully


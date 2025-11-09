# Gmail App Password Setup Guide

## Problem
Gmail requires an "App Password" for SMTP access. Your regular Gmail password will NOT work.

## Solution: Create a Gmail App Password

### Step 1: Enable 2-Step Verification
1. Go to: https://myaccount.google.com/security
2. Under "Signing in to Google", click **2-Step Verification**
3. If not enabled, follow the prompts to enable it
4. You'll need your phone for verification

### Step 2: Create App Password
1. Go to: https://myaccount.google.com/apppasswords
   - Or navigate: Google Account → Security → 2-Step Verification → App passwords
2. You may be asked to sign in again
3. Under "Select app", choose **Mail**
4. Under "Select device", choose **Other (Custom name)**
5. Enter a name like: **HRMS**
6. Click **Generate**
7. **Copy the 16-character password** that appears (e.g., `abcd efgh ijkl mnop`)
   - You'll only see this once, so copy it immediately!

### Step 3: Update Your .env File
1. Open `backend/.env` file
2. Replace the `SMTP_PASSWORD` line with your App Password:
   ```env
   SMTP_PASSWORD=abcdefghijklmnop
   ```
   - Remove spaces if there are any
   - Or keep spaces, both work: `abcd efgh ijkl mnop`

### Step 4: Restart Your Server
```bash
cd backend
npm run dev
```

### Step 5: Test Email
Run the test script:
```bash
node test-email-direct.js
```

## Important Notes

⚠️ **DO NOT use your regular Gmail password!**
- Gmail will reject it
- You'll get an authentication error
- You MUST use an App Password

✅ **App Passwords are safe:**
- They're specific to one app (HRMS)
- You can revoke them anytime
- They don't give full account access

## Troubleshooting

**If you can't see "App passwords" option:**
- Make sure 2-Step Verification is enabled first
- Wait a few minutes after enabling 2-Step Verification
- Try refreshing the page

**If App Password doesn't work:**
- Make sure you copied it correctly (no extra spaces)
- Try removing spaces from the password
- Create a new App Password and try again

**If you still get errors:**
- Check that 2-Step Verification is enabled
- Verify you're using the App Password, not your regular password
- Make sure your .env file is saved
- Restart your server after updating .env


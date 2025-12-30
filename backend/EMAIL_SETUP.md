# Email Setup Guide - Phase 1

## Step 1: Create `.env` file

Create a `.env` file in the `backend` directory with the following content:

```env
# Application Secret Key (change in production)
SECRET_KEY=your-secret-key-change-in-production

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Email Configuration (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ponnapuvvulasaiprasad@gmail.com
SMTP_PASSWORD=uklm egat xqua obze
SMTP_FROM_EMAIL=ponnapuvvulasaiprasad@gmail.com
CONTACT_EMAIL=ponnapuvvulasaiprasad@gmail.com
```

## Step 2: Verify Configuration

Make sure:
- ✅ `SMTP_USER` is your Gmail address
- ✅ `SMTP_PASSWORD` is your Gmail App Password (not your regular password)
- ✅ `CONTACT_EMAIL` is where you want to receive contact form submissions
- ✅ `SMTP_PORT` is 587 (for TLS) or 465 (for SSL)

## Step 3: Test the Setup

1. Start the backend server:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. Go to the Contact page on your frontend
3. Fill out and submit the contact form
4. Check your Gmail inbox for the notification email

## Troubleshooting

### Email not sending?
- Check that `.env` file exists and has correct values
- Verify Gmail App Password is correct (no spaces in the password)
- Check backend logs for error messages
- Ensure port 587 is not blocked by firewall

### Rate limiting?
- Default: 3 submissions per hour per IP
- If you need to test multiple times, wait 1 hour or change IP

## Next Steps

Once email is working, we'll move to Phase 2: Admin Panel integration.


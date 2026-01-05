# Environment Variables Setup Guide for Render.com

## Overview

This guide explains how to set up all required environment variables for Eagle Logistics on Render.com.

---

## 🔐 Required Environment Variables

### 1. **SECRET_KEY** (REQUIRED)
**Purpose**: Used for JWT token signing and encryption

**How to Generate**:
```bash
# Option 1: Using Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Option 2: Using OpenSSL
openssl rand -hex 32

# Option 3: Online generator
# Visit: https://generate-secret.vercel.app/32
```

**Example Value**: `xK9mP2vQ7wR5tY8uI0oP3aS6dF1gH4jK7lZ0xN9cV2bM5`

**Where to Set**: Render Dashboard → Your Backend Service → Environment → Add `SECRET_KEY`

---

### 2. **GROQ_API_KEY** (REQUIRED for Chat Feature)
**Purpose**: API key for GROQ LLM service (powers the chat bot)

**How to Get**:
1. Go to https://console.groq.com/
2. Sign up or log in
3. Navigate to **API Keys** section
4. Click **"Create API Key"**
5. Copy the key (starts with `gsk_...`)

**Example Value**: `gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Where to Set**: Render Dashboard → Your Backend Service → Environment → Add `GROQ_API_KEY`

**Note**: Without this, the chat feature won't work, but other features will function normally.

---

### 3. **SMTP Configuration** (REQUIRED for Email Features)

#### 3a. **SMTP_USER**
**Purpose**: Gmail address for sending emails

**Value**: Your Gmail address (e.g., `yourname@gmail.com`)

#### 3b. **SMTP_PASSWORD**
**Purpose**: Gmail App Password (NOT your regular Gmail password)

**How to Get Gmail App Password**:
1. Go to https://myaccount.google.com/
2. Click **Security** → **2-Step Verification** (must be enabled)
3. Scroll down to **App passwords**
4. Click **App passwords**
5. Select **Mail** and **Other (Custom name)**
6. Enter name: "Eagle Logistics"
7. Click **Generate**
8. Copy the 16-character password (no spaces)

**Example Value**: `abcd efgh ijkl mnop` (use without spaces: `abcdefghijklmnop`)

#### 3c. **SMTP_FROM_EMAIL**
**Purpose**: Email address shown as sender

**Value**: Usually same as `SMTP_USER` (e.g., `yourname@gmail.com`)

#### 3d. **CONTACT_EMAIL**
**Purpose**: Admin email for receiving contact form submissions

**Value**: Admin email address (e.g., `admin@eaglelogistics.in` or your Gmail)

**Where to Set**: Render Dashboard → Your Backend Service → Environment → Add all SMTP variables

**Note**: Without SMTP config, contact form won't send emails, but will still save submissions.

---

### 4. **CORS_ORIGINS** (REQUIRED)
**Purpose**: Allows frontend to communicate with backend

**Format**: Comma-separated list of URLs (no spaces after commas)

**Initial Value** (before frontend deployment):
```
https://eagle-logistics-frontend.onrender.com
```

**After Frontend Deployment**:
```
https://eagle-logistics-frontend.onrender.com,https://your-custom-domain.com
```

**Where to Set**: Render Dashboard → Your Backend Service → Environment → Add `CORS_ORIGINS`

**Important**: 
- Update this AFTER frontend is deployed
- Include all domains that will access your API
- No trailing slashes

---

### 5. **ENV** (OPTIONAL but Recommended)
**Purpose**: Sets application environment

**Value**: `production`

**Where to Set**: Render Dashboard → Your Backend Service → Environment → Add `ENV`

---

### 6. **LOG_LEVEL** (OPTIONAL)
**Purpose**: Controls logging verbosity

**Value**: `INFO` (for production) or `DEBUG` (for troubleshooting)

**Where to Set**: Render Dashboard → Your Backend Service → Environment → Add `LOG_LEVEL`

---

## 📋 Complete Environment Variables Checklist

### Backend Service (Required)
- [ ] `SECRET_KEY` - Generated random string
- [ ] `GROQ_API_KEY` - From GROQ console
- [ ] `SMTP_USER` - Your Gmail address
- [ ] `SMTP_PASSWORD` - Gmail App Password
- [ ] `SMTP_FROM_EMAIL` - Sender email
- [ ] `CONTACT_EMAIL` - Admin email
- [ ] `CORS_ORIGINS` - Frontend URL(s)
- [ ] `ENV` - Set to `production`
- [ ] `LOG_LEVEL` - Set to `INFO`

### Frontend Service (Required)
- [ ] `VITE_API_URL` - Backend URL (e.g., `https://eagle-logistics-backend.onrender.com`)

---

## 🚀 Step-by-Step Setup in Render Dashboard

### For Backend Service:

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Select your backend service

2. **Navigate to Environment**
   - Click on **"Environment"** tab in left sidebar

3. **Add Each Variable**
   - Click **"Add Environment Variable"**
   - Enter **Key** (e.g., `SECRET_KEY`)
   - Enter **Value** (e.g., your generated secret)
   - Click **"Save Changes"**
   - Repeat for each variable

4. **Verify All Variables**
   - Scroll through the list
   - Ensure all required variables are present
   - Check for typos

5. **Redeploy** (if service is already running)
   - Go to **"Manual Deploy"** tab
   - Click **"Deploy latest commit"**

---

## 🔄 Updating Environment Variables

### To Update a Variable:
1. Go to **Environment** tab
2. Find the variable
3. Click **"Edit"** (pencil icon)
4. Update the value
5. Click **"Save Changes"**
6. Service will automatically redeploy

### To Add a New Variable:
1. Go to **Environment** tab
2. Click **"Add Environment Variable"**
3. Enter Key and Value
4. Click **"Save Changes"**

---

## ⚠️ Important Security Notes

1. **Never commit `.env` files** to Git
2. **Never share** your `SECRET_KEY` or `GROQ_API_KEY`
3. **Use App Passwords** for Gmail, not your regular password
4. **Rotate keys** if compromised
5. **Use different keys** for development and production

---

## 🧪 Testing Your Configuration

### Test Backend:
1. Visit: `https://your-backend.onrender.com/health`
2. Should return: `{"status": "healthy"}`

### Test API:
1. Visit: `https://your-backend.onrender.com/docs`
2. Should show Swagger UI

### Test CORS:
1. Open browser console on frontend
2. Make an API call
3. Should not see CORS errors

---

## 📝 Example Complete Configuration

```bash
# Security
SECRET_KEY=xK9mP2vQ7wR5tY8uI0oP3aS6dF1gH4jK7lZ0xN9cV2bM5

# GROQ API
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email (Gmail SMTP)
SMTP_USER=yourname@gmail.com
SMTP_PASSWORD=abcdefghijklmnop
SMTP_FROM_EMAIL=yourname@gmail.com
CONTACT_EMAIL=admin@eaglelogistics.in

# CORS
CORS_ORIGINS=https://eagle-logistics-frontend.onrender.com

# Environment
ENV=production
LOG_LEVEL=INFO
```

---

## 🆘 Common Issues

### Issue: "SECRET_KEY not set"
**Solution**: Add `SECRET_KEY` environment variable with a random string

### Issue: "CORS error in browser"
**Solution**: 
- Check `CORS_ORIGINS` includes your frontend URL
- Ensure no trailing slashes
- Verify backend is running

### Issue: "Email not sending"
**Solution**:
- Verify Gmail App Password (not regular password)
- Check 2-Step Verification is enabled
- Ensure SMTP variables are correct

### Issue: "Chat bot not working"
**Solution**:
- Verify `GROQ_API_KEY` is set correctly
- Check GROQ API quota/limits
- Review backend logs for errors

---

## 📞 Need Help?

- Check Render logs: Dashboard → Your Service → Logs
- Review backend logs for specific error messages
- Verify all environment variables are set correctly
- Test API endpoints using `/docs` Swagger UI


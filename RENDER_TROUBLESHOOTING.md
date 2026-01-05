# Troubleshooting Guide for Render.com Deployment

## Quick Diagnosis

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| Service won't start | Missing env vars or build error | Check logs, verify env vars |
| 502 Bad Gateway | Service crashed | Check logs for errors |
| CORS errors | CORS_ORIGINS not set correctly | Update CORS_ORIGINS |
| Data lost after deploy | No persistent disk | Add persistent disk |
| Images not loading | Wrong upload path or CORS | Check paths and CORS |
| Email not sending | SMTP config wrong | Verify Gmail App Password |
| Chat not working | GROQ_API_KEY missing | Add GROQ_API_KEY |

---

## 🔴 Backend Issues

### Issue 1: Service Won't Start

**Symptoms**:
- Service shows "Failed" status
- Build completes but service crashes
- Logs show import errors or missing modules

**Diagnosis Steps**:
1. Go to **Logs** tab in Render Dashboard
2. Check for error messages
3. Look for:
   - `ModuleNotFoundError`
   - `ImportError`
   - `FileNotFoundError`
   - Environment variable errors

**Common Causes & Solutions**:

#### Cause: Missing Dependencies
```
ModuleNotFoundError: No module named 'fastapi'
```
**Solution**:
- Check `requirements.txt` includes all packages
- Verify build command: `pip install -r requirements.txt`
- Check Python version (should be 3.9+)

#### Cause: Wrong Start Command
```
Error: uvicorn: command not found
```
**Solution**:
- Verify start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Ensure uvicorn is in `requirements.txt`
- Check root directory is set to `backend`

#### Cause: Missing Environment Variables
```
Error: SECRET_KEY not set
```
**Solution**:
- Go to **Environment** tab
- Add all required variables (see `RENDER_ENV_SETUP.md`)
- Redeploy service

#### Cause: Wrong Root Directory
```
Error: No such file or directory: app/main.py
```
**Solution**:
- Go to **Settings** → **Root Directory**
- Set to: `backend`
- Not: `./backend` or empty

---

### Issue 2: 502 Bad Gateway / Service Unavailable

**Symptoms**:
- Service shows as "Live" but returns 502
- Health check fails
- API endpoints don't respond

**Diagnosis Steps**:
1. Check **Logs** for runtime errors
2. Check **Metrics** for memory/CPU usage
3. Verify service is actually running

**Common Causes & Solutions**:

#### Cause: Service Crashed
```
Process exited with code 1
```
**Solution**:
- Check logs for specific error
- Common: Missing env vars, import errors
- Fix the error and redeploy

#### Cause: Port Binding Issue
```
Error: Address already in use
```
**Solution**:
- Ensure start command uses `$PORT`:
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```
- Don't hardcode port number

#### Cause: Out of Memory
```
Killed (out of memory)
```
**Solution**:
- Free tier has limited memory
- Upgrade to paid plan
- Or optimize code (reduce memory usage)

#### Cause: Service Sleeping (Free Tier)
```
Service is sleeping
```
**Solution**:
- Free tier services sleep after 15 min inactivity
- First request after sleep takes ~30 seconds
- This is normal for free tier
- Upgrade to paid for always-on service

---

### Issue 3: CORS Errors

**Symptoms**:
- Browser console shows: `CORS policy: No 'Access-Control-Allow-Origin'`
- Frontend can't connect to backend
- API calls fail with CORS error

**Diagnosis Steps**:
1. Check browser console for CORS error
2. Verify `CORS_ORIGINS` environment variable
3. Check backend logs

**Solutions**:

#### Solution 1: Set CORS_ORIGINS
1. Go to **Environment** tab
2. Add/Update `CORS_ORIGINS`:
   ```
   https://your-frontend-url.onrender.com
   ```
3. **Important**: 
   - No trailing slashes
   - Include `https://`
   - Comma-separate multiple origins
4. Redeploy service

#### Solution 2: Verify Frontend URL
- Ensure `CORS_ORIGINS` matches your frontend URL exactly
- Check for typos
- Include protocol (`https://`)

#### Solution 3: Check CORS Middleware
- Verify `backend/app/middleware.py` is loaded
- Check `backend/app/main.py` calls `setup_cors(app)`

---

### Issue 4: Data Not Persisting

**Symptoms**:
- Changes lost after redeploy
- Uploaded images disappear
- Admin data resets

**Diagnosis Steps**:
1. Check if persistent disk is configured
2. Verify disk mount path
3. Check disk status

**Solutions**:

#### Solution 1: Add Persistent Disk
1. Go to **Disks** tab
2. Click **"Add Disk"**
3. Set mount path: `/opt/render/project/src/backend/storage`
4. Set size: 1GB (free) or more
5. See `RENDER_DISK_SETUP.md` for details

#### Solution 2: Verify Mount Path
- Must be: `/opt/render/project/src/backend/storage`
- Check **Disks** tab → Status should be "Attached"
- Verify root directory is `backend`

#### Solution 3: Check File Paths
- Verify `backend/app/config.py`:
  ```python
  DATA_DIR: Path = BASE_DIR / "storage" / "data"
  UPLOADS_DIR: Path = BASE_DIR / "storage" / "uploads"
  ```

---

### Issue 5: Images Not Loading

**Symptoms**:
- Images return 404
- Images show broken icon
- Upload works but images don't display

**Diagnosis Steps**:
1. Check image URL in browser
2. Verify image exists in storage
3. Check CORS for image endpoint

**Solutions**:

#### Solution 1: Check Image Path
- Images should be at: `/api/public/uploads/{filename}`
- Verify backend serves static files:
  ```python
  app.mount("/uploads", StaticFiles(...))
  ```

#### Solution 2: Verify CORS for Images
- Ensure `CORS_ORIGINS` includes frontend URL
- Check image endpoint allows CORS

#### Solution 3: Check Persistent Disk
- Images stored in `storage/uploads/`
- Ensure persistent disk is mounted
- Verify disk contains uploaded files

---

### Issue 6: Email Not Sending

**Symptoms**:
- Contact form submits but no email received
- Error in logs about SMTP
- Email service fails

**Diagnosis Steps**:
1. Check logs for SMTP errors
2. Verify SMTP environment variables
3. Test email configuration

**Solutions**:

#### Solution 1: Verify Gmail App Password
- Must use **App Password**, not regular password
- Enable 2-Step Verification first
- Generate new app password if needed
- See `RENDER_ENV_SETUP.md` for details

#### Solution 2: Check SMTP Variables
- `SMTP_USER`: Your Gmail address
- `SMTP_PASSWORD`: 16-char app password (no spaces)
- `SMTP_FROM_EMAIL`: Usually same as SMTP_USER
- `CONTACT_EMAIL`: Admin email for receiving

#### Solution 3: Test SMTP Connection
- Check logs for specific SMTP error
- Common: "Authentication failed" = wrong password
- Common: "Connection refused" = wrong host/port

---

### Issue 7: Chat Bot Not Working

**Symptoms**:
- Chat endpoint returns error
- "GROQ API key not found"
- Chat responses fail

**Diagnosis Steps**:
1. Check logs for GROQ API errors
2. Verify `GROQ_API_KEY` is set
3. Check GROQ API quota

**Solutions**:

#### Solution 1: Add GROQ_API_KEY
1. Go to **Environment** tab
2. Add `GROQ_API_KEY` with your key from https://console.groq.com/
3. Redeploy service

#### Solution 2: Check API Key Format
- Should start with `gsk_`
- No spaces or extra characters
- Copy directly from GROQ console

#### Solution 3: Verify API Quota
- Check GROQ console for usage limits
- Free tier has rate limits
- May need to upgrade GROQ plan

---

## 🟡 Frontend Issues

### Issue 1: Build Fails

**Symptoms**:
- Frontend deployment shows "Build failed"
- Build logs show errors
- Service not created

**Common Causes & Solutions**:

#### Cause: Node Version
```
Error: Node version not supported
```
**Solution**:
- Render auto-detects Node version
- Ensure `package.json` specifies Node 18+
- Check build logs for version

#### Cause: Missing Dependencies
```
Error: Cannot find module 'react'
```
**Solution**:
- Verify `package.json` has all dependencies
- Check build command: `npm install && npm run build`
- Ensure `package-lock.json` is committed

#### Cause: Build Command Error
```
Error: npm run build failed
```
**Solution**:
- Check build logs for specific error
- Test build locally first: `npm run build`
- Fix errors before deploying

---

### Issue 2: Frontend Can't Connect to Backend

**Symptoms**:
- API calls fail
- Network errors in console
- "Failed to fetch" errors

**Solutions**:

#### Solution 1: Set VITE_API_URL
1. Go to **Environment** tab
2. Add `VITE_API_URL`:
   ```
   https://your-backend-url.onrender.com
   ```
3. **Important**: Include `https://` and no trailing slash
4. Redeploy frontend

#### Solution 2: Check Backend URL
- Verify backend is running
- Test backend: `https://your-backend.onrender.com/health`
- Should return: `{"status": "healthy"}`

#### Solution 3: Verify CORS
- Check backend `CORS_ORIGINS` includes frontend URL
- No trailing slashes
- Include protocol

---

### Issue 3: Blank Page / White Screen

**Symptoms**:
- Frontend loads but shows blank page
- No errors in console
- Build succeeded

**Solutions**:

#### Solution 1: Check Browser Console
- Open browser DevTools (F12)
- Check Console for errors
- Check Network tab for failed requests

#### Solution 2: Verify Build Output
- Check build logs
- Ensure `dist` folder is created
- Verify `Publish Directory` is set to `dist`

#### Solution 3: Check Base Path
- Verify `vite.config.js` base path
- Check React Router configuration
- Ensure routes are correct

---

## 🟢 General Issues

### Issue: Service Sleeping (Free Tier)

**Symptoms**:
- Service works but first request is slow (~30 seconds)
- Service shows "Sleeping" status

**Solution**:
- This is **normal** for free tier
- Service sleeps after 15 min inactivity
- First request wakes it up (takes ~30 seconds)
- Subsequent requests are fast
- **Upgrade to paid** for always-on service

---

### Issue: Slow Response Times

**Symptoms**:
- API calls take long time
- Frontend loads slowly

**Solutions**:

#### Solution 1: Check Service Plan
- Free tier has limited resources
- Upgrade to paid for better performance
- Check **Metrics** tab for resource usage

#### Solution 2: Optimize Code
- Reduce image sizes
- Optimize database queries (if using DB)
- Enable caching where possible

#### Solution 3: Check Region
- Choose closest region to users
- Render auto-selects, but can change in settings

---

### Issue: Deployment Takes Too Long

**Symptoms**:
- Build takes 10+ minutes
- Deployment hangs

**Solutions**:

#### Solution 1: Check Build Logs
- Look for specific step that's slow
- Common: `npm install` takes long
- Common: `pip install` takes long

#### Solution 2: Optimize Dependencies
- Remove unused packages
- Use `package-lock.json` for faster npm installs
- Consider caching (paid tier)

#### Solution 3: Check Network
- Render may be slow during peak times
- Retry deployment
- Contact Render support if persistent

---

## 📊 How to Read Logs

### Backend Logs:
1. Go to **Logs** tab
2. Look for:
   - `INFO` = Normal operation
   - `WARNING` = Non-critical issue
   - `ERROR` = Problem that needs fixing
   - `CRITICAL` = Service may crash

### Common Log Patterns:

```
INFO: Application startup complete
```
✅ Service started successfully

```
ERROR: SECRET_KEY not set
```
❌ Missing environment variable

```
WARNING: CORS request from unauthorized origin
```
⚠️ CORS configuration issue

```
ERROR: ModuleNotFoundError: No module named 'fastapi'
```
❌ Missing dependency

---

## 🆘 Getting Help

### 1. Check Documentation
- `RENDER_DEPLOYMENT.md` - Deployment guide
- `RENDER_ENV_SETUP.md` - Environment variables
- `RENDER_DISK_SETUP.md` - Persistent disk

### 2. Review Logs
- Render Dashboard → Your Service → Logs
- Look for ERROR or CRITICAL messages
- Copy error messages for reference

### 3. Test Locally
- Reproduce issue locally
- Fix locally first
- Then deploy fix

### 4. Contact Support
- Render Support: support@render.com
- Include:
  - Service name
  - Error logs
  - Steps to reproduce
  - What you've tried

---

## ✅ Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All environment variables set
- [ ] Persistent disk configured
- [ ] Build commands correct
- [ ] Start commands use `$PORT`
- [ ] Root directory set correctly
- [ ] CORS_ORIGINS configured
- [ ] Tested locally first
- [ ] All dependencies in requirements.txt/package.json

---

## 🔧 Quick Fixes Reference

| Problem | Quick Fix |
|---------|-----------|
| Service won't start | Check logs, verify env vars |
| CORS error | Update CORS_ORIGINS |
| Data lost | Add persistent disk |
| Email fails | Check Gmail App Password |
| Chat fails | Add GROQ_API_KEY |
| Build fails | Check build logs, test locally |
| Slow response | Normal for free tier (sleeping) |

---

Good luck with your deployment! 🚀


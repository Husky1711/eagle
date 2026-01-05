# Persistent Disk Setup Guide for Render.com

## Overview

Eagle Logistics uses JSON files for data storage and file uploads. These need to persist across deployments. This guide shows how to configure persistent disk storage on Render.com.

---

## 🎯 Why Persistent Disk?

Without persistent disk:
- ❌ JSON files (admin data, couriers, pages, settings) will be **lost** on restart
- ❌ Uploaded images will be **deleted** on deployment
- ❌ All admin changes will be **reset**

With persistent disk:
- ✅ Data persists across deployments
- ✅ Uploads are saved permanently
- ✅ Admin changes are preserved

---

## 📍 Storage Structure

Your application uses these directories:
```
backend/storage/
├── data/          # JSON files (admin.json, couriers.json, pages.json, etc.)
├── uploads/       # Uploaded images and media
│   └── profiles/ # Admin profile images
└── temp/         # Temporary import files
```

---

## 🚀 Step-by-Step Disk Setup

### Step 1: Navigate to Your Backend Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on your backend service (e.g., `eagle-logistics-backend`)

### Step 2: Add Persistent Disk

1. Click on **"Disks"** tab in the left sidebar
2. Click **"Add Disk"** button
3. Fill in the configuration:

   **Disk Name**: `eagle-logistics-storage`
   - This is just a label for your reference

   **Mount Path**: `/opt/render/project/src/backend/storage`
   - ⚠️ **IMPORTANT**: This must match exactly
   - This is where Render will mount the disk
   - Your code expects storage at `backend/storage/`

   **Size**: 
   - **Free Tier**: 1GB (sufficient for testing)
   - **Paid Tier**: Choose based on needs (5GB recommended for production)

4. Click **"Add Disk"**

### Step 3: Verify Disk Mount

1. After adding disk, you'll see it in the **"Disks"** list
2. Status should show as **"Attached"**
3. The service will automatically redeploy

### Step 4: Verify Storage Works

1. After deployment, check logs for any errors
2. Access admin panel: `https://your-backend.onrender.com/admin/login`
3. Upload an image or make a change
4. Redeploy the service
5. Verify the data/image still exists (it should!)

---

## 🔍 Mount Path Explanation

### Why `/opt/render/project/src/backend/storage`?

Render's directory structure:
```
/opt/render/project/src/     # Root of your repository
├── backend/                 # Your backend folder
│   ├── app/
│   ├── storage/            # ← This is where we mount the disk
│   │   ├── data/
│   │   └── uploads/
│   └── requirements.txt
└── frontend/
```

The mount path must point to the `storage` directory inside your `backend` folder.

---

## ✅ Verification Checklist

After setting up disk:

- [ ] Disk appears in "Disks" tab
- [ ] Status shows "Attached"
- [ ] Service redeployed successfully
- [ ] Can create/update data in admin panel
- [ ] Can upload images
- [ ] Data persists after redeploy

---

## 🧪 Testing Persistent Storage

### Test 1: Create Data
1. Log into admin panel
2. Add a new courier or update page content
3. Verify it saves

### Test 2: Upload Image
1. Go to Media Manager
2. Upload an image
3. Verify it appears

### Test 3: Verify Persistence
1. Make a change (add courier, upload image)
2. Go to Render Dashboard
3. Click **"Manual Deploy"** → **"Deploy latest commit"**
4. Wait for deployment to complete
5. Check admin panel - your changes should still be there!

---

## 📊 Disk Size Recommendations

| Usage | Recommended Size | Free Tier Available |
|-------|-----------------|---------------------|
| Testing/Development | 1GB | ✅ Yes |
| Small Production | 5GB | ❌ No (paid) |
| Medium Production | 10GB | ❌ No (paid) |
| Large Production | 20GB+ | ❌ No (paid) |

**Note**: You can upgrade disk size later if needed.

---

## 🔧 Troubleshooting

### Issue: "Disk not mounting"

**Symptoms**:
- Service starts but data doesn't persist
- Errors in logs about file paths

**Solutions**:
1. **Check Mount Path**:
   - Must be: `/opt/render/project/src/backend/storage`
   - Not: `/opt/render/project/src/storage`
   - Not: `/backend/storage`

2. **Verify Root Directory**:
   - In service settings, **Root Directory** should be: `backend`
   - Not empty, not `./backend`

3. **Check Disk Status**:
   - Go to "Disks" tab
   - Ensure status is "Attached"
   - If "Detached", click "Attach"

### Issue: "Data still lost after redeploy"

**Possible Causes**:
1. **Wrong mount path** - Check mount path matches exactly
2. **Disk not attached** - Check disk status
3. **Code writing to wrong location** - Verify `config.py` paths

**Solution**:
1. Check logs for file path errors
2. Verify mount path in Disks tab
3. Check `backend/app/config.py`:
   ```python
   DATA_DIR: Path = BASE_DIR / "storage" / "data"
   UPLOADS_DIR: Path = BASE_DIR / "storage" / "uploads"
   ```

### Issue: "Disk full"

**Symptoms**:
- Can't upload files
- Errors about disk space

**Solutions**:
1. **Check Disk Usage**:
   - Go to "Disks" tab
   - Check "Used" vs "Total" size

2. **Clean Up**:
   - Delete unused images in admin panel
   - Remove old temporary files
   - Clear logs if stored on disk

3. **Upgrade Disk**:
   - Go to "Disks" tab
   - Click "Resize" (paid tier only)
   - Increase size

### Issue: "Permission denied"

**Symptoms**:
- Errors about file permissions
- Can't write to storage directory

**Solutions**:
1. **Check Directory Permissions**:
   - Render should handle this automatically
   - If issues persist, contact Render support

2. **Verify Directory Exists**:
   - Your code creates directories automatically:
   ```python
   settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
   settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
   ```

---

## 📝 Important Notes

1. **Disk is Persistent**: Data survives:
   - Service restarts
   - Code deployments
   - Service updates
   - Manual redeploys

2. **Disk is NOT Backed Up**: 
   - Render doesn't automatically backup disk
   - **Important**: Backup your data regularly
   - Export JSON files from admin panel periodically

3. **Free Tier Limitation**:
   - 1GB disk size limit on free tier
   - Sufficient for testing, may need upgrade for production

4. **Disk Costs** (Paid Tier):
   - $0.25 per GB per month
   - 5GB = $1.25/month
   - 10GB = $2.50/month

---

## 🔄 Upgrading Disk Size

If you need more space:

1. Go to **"Disks"** tab
2. Click on your disk
3. Click **"Resize"** (if available on your plan)
4. Select new size
5. Confirm (may cause brief downtime)

**Note**: Free tier cannot resize. Need to upgrade to paid plan.

---

## 🆘 Still Having Issues?

1. **Check Render Logs**:
   - Dashboard → Your Service → Logs
   - Look for file path or permission errors

2. **Verify Configuration**:
   - Mount path: `/opt/render/project/src/backend/storage`
   - Root directory: `backend`
   - Disk status: Attached

3. **Test Locally**:
   - Ensure storage works locally first
   - Verify paths in `config.py`

4. **Contact Support**:
   - Render Support: support@render.com
   - Include service name and error logs

---

## ✅ Quick Reference

**Mount Path**: `/opt/render/project/src/backend/storage`

**Minimum Size**: 1GB (free tier)

**Recommended Size**: 5GB (production)

**Status Check**: Dashboard → Disks → Status should be "Attached"


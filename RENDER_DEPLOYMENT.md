# Render.com Deployment Guide for Eagle Logistics

## Prerequisites

1. GitHub account with your code repository
2. Render.com account (sign up at https://render.com)
3. Environment variables ready (see `.env.example`)

## Step-by-Step Deployment

### 1. Backend Deployment

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the `render-v1.0.0` branch
5. Configure the service:
   - **Name**: `eagle-logistics-backend`
   - **Environment**: `Python 3`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free (or choose paid for better performance)

6. Add Environment Variables:
   ```
   SECRET_KEY=<generate-random-string>
   GROQ_API_KEY=<your-groq-key>
   SMTP_USER=<your-gmail>
   SMTP_PASSWORD=<gmail-app-password>
   SMTP_FROM_EMAIL=<your-email>
   CONTACT_EMAIL=<admin-email>
   CORS_ORIGINS=https://your-frontend-url.onrender.com
   ENV=production
   LOG_LEVEL=INFO
   ```

7. Add Persistent Disk:
   - Go to **"Disks"** tab
   - Click **"Add Disk"**
   - Name: `eagle-logistics-storage`
   - Mount Path: `/opt/render/project/src/backend/storage`
   - Size: 1GB (free tier) or more

8. Click **"Create Web Service"**

### 2. Frontend Deployment

1. In Render Dashboard, click **"New +"** → **"Static Site"**
2. Connect your GitHub repository
3. Select the `render-v1.0.0` branch
4. Configure:
   - **Name**: `eagle-logistics-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Environment Variable**:
     - Key: `VITE_API_URL`
     - Value: `https://eagle-logistics-backend.onrender.com` (your backend URL)

5. Click **"Create Static Site"**

### 3. Update CORS in Backend

After frontend is deployed, update the backend environment variable:
- `CORS_ORIGINS=https://eagle-logistics-frontend.onrender.com`

### 4. Initialize Data

After first deployment, you may need to:
1. Access backend admin panel: `https://your-backend.onrender.com/admin/login`
2. Create admin user (or use existing credentials)
3. Upload initial data if needed

## URLs

- **Backend API**: `https://eagle-logistics-backend.onrender.com`
- **Frontend**: `https://eagle-logistics-frontend.onrender.com`
- **API Docs**: `https://eagle-logistics-backend.onrender.com/docs`

## Important Notes

1. **Free Tier Limitations**:
   - Service sleeps after 15 minutes of inactivity
   - First request after sleep takes ~30 seconds (cold start)
   - 750 hours/month free compute time

2. **Storage**:
   - JSON files and uploads are stored on persistent disk
   - Data persists across deployments
   - Backup important data regularly

3. **Environment Variables**:
   - Never commit `.env` file to git
   - Use Render's environment variable settings
   - Update CORS_ORIGINS after frontend deployment

4. **Monitoring**:
   - Check Render logs for errors
   - Monitor disk usage
   - Set up alerts if needed

## Troubleshooting

### Backend won't start
- Check logs in Render dashboard
- Verify all environment variables are set
- Ensure `requirements.txt` is correct

### Frontend can't connect to backend
- Verify `VITE_API_URL` is set correctly
- Check CORS settings in backend
- Ensure backend is running

### Data not persisting
- Verify persistent disk is mounted correctly
- Check disk mount path matches configuration
- Ensure storage directories exist

## Support

For issues, check:
- Render documentation: https://render.com/docs
- Backend logs in Render dashboard
- Frontend build logs


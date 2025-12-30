# Deployment Plan - Logistics Aggregator CMS

Complete deployment guide for frontend and backend with hosting options, NGINX configuration, and troubleshooting.

## 📋 Table of Contents

- [Deployment Overview](#deployment-overview)
- [Hosting Options](#hosting-options)
- [Prerequisites](#prerequisites)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [NGINX Configuration](#nginx-configuration)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Environment Configuration](#environment-configuration)
- [Common Issues & Solutions](#common-issues--solutions)
- [Cost Estimation](#cost-estimation)
- [Demo-Friendly Options](#demo-friendly-options)

## 🎯 Deployment Overview

### Architecture

```
Internet
    │
    ▼
┌─────────────┐
│   Domain    │
│  (example.com)│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   NGINX     │
│  (Port 80/443)│
│  Reverse Proxy│
└──────┬──────┘
       │
       ├──────────────┬──────────────┐
       ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐
│ Frontend │   │ Backend  │   │  Static  │
│  (React) │   │ (FastAPI)│   │  Files   │
│  Port 80 │   │ Port 8000│   │ (Uploads)│
└──────────┘   └──────────┘   └──────────┘
```

## 🌐 Hosting Options

### Option 1: VPS (Virtual Private Server) - Recommended for Production

**Providers:**
- **DigitalOcean**: $6-12/month (1GB RAM, 1 vCPU)
- **Linode**: $5-10/month
- **Vultr**: $6-12/month
- **AWS EC2**: Pay-as-you-go
- **Google Cloud**: Pay-as-you-go

**Pros:**
- Full control
- Custom configuration
- Scalable
- Cost-effective

**Cons:**
- Requires server management
- Need to configure everything

### Option 2: Platform-as-a-Service (PaaS) - Easiest for Demo

**Frontend:**
- **Vercel**: Free tier available
- **Netlify**: Free tier available
- **Cloudflare Pages**: Free tier

**Backend:**
- **Railway**: $5/month
- **Render**: Free tier available
- **Fly.io**: Free tier available
- **Heroku**: $7/month (no free tier)

**Pros:**
- Easy deployment
- Automatic SSL
- Built-in CI/CD
- Minimal configuration

**Cons:**
- Less control
- Platform limitations
- May have costs

### Option 3: Cloud Platforms - Enterprise

**AWS:**
- Frontend: S3 + CloudFront
- Backend: EC2 or Elastic Beanstalk

**Google Cloud:**
- Frontend: Cloud Storage + CDN
- Backend: Cloud Run or Compute Engine

**Azure:**
- Frontend: Static Web Apps
- Backend: App Service

## 📦 Prerequisites

### Server Requirements

**Minimum:**
- CPU: 1 vCPU
- RAM: 1GB
- Storage: 10GB
- OS: Ubuntu 20.04/22.04 LTS

**Recommended:**
- CPU: 2 vCPU
- RAM: 2GB
- Storage: 20GB
- OS: Ubuntu 22.04 LTS

### Software Requirements

```bash
# Backend
- Python 3.11+
- pip
- virtualenv
- NGINX
- Certbot (for SSL)

# Frontend
- Node.js 18+
- npm
- Build tools
```

## 🚀 Backend Deployment

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python
sudo apt install python3.11 python3.11-venv python3-pip -y

# Install NGINX
sudo apt install nginx -y

# Install Certbot (for SSL)
sudo apt install certbot python3-certbot-nginx -y

# Install Git
sudo apt install git -y
```

### Step 2: Clone Repository

```bash
# Create app directory
sudo mkdir -p /var/www/logistics-aggregator
sudo chown $USER:$USER /var/www/logistics-aggregator

# Clone repository
cd /var/www/logistics-aggregator
git clone https://github.com/Husky1711/eagle.git .

# Navigate to backend
cd backend
```

### Step 3: Python Environment Setup

```bash
# Create virtual environment
python3.11 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 4: Environment Configuration

```bash
# Create .env file
nano .env
```

```env
# Security
SECRET_KEY=your-strong-secret-key-here-change-this
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
CONTACT_EMAIL=admin@yourdomain.com
```

### Step 5: Create Systemd Service

```bash
# Create service file
sudo nano /etc/systemd/system/logistics-backend.service
```

```ini
[Unit]
Description=Logistics Aggregator Backend API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/logistics-aggregator/backend
Environment="PATH=/var/www/logistics-aggregator/backend/venv/bin"
ExecStart=/var/www/logistics-aggregator/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable logistics-backend
sudo systemctl start logistics-backend

# Check status
sudo systemctl status logistics-backend
```

### Step 6: Create Storage Directories

```bash
# Create storage directories
mkdir -p /var/www/logistics-aggregator/backend/storage/data
mkdir -p /var/www/logistics-aggregator/backend/storage/uploads
mkdir -p /var/www/logistics-aggregator/backend/storage/uploads/profiles
mkdir -p /var/www/logistics-aggregator/backend/logs

# Set permissions
sudo chown -R www-data:www-data /var/www/logistics-aggregator/backend/storage
sudo chown -R www-data:www-data /var/www/logistics-aggregator/backend/logs
sudo chmod -R 755 /var/www/logistics-aggregator/backend/storage
```

## 🎨 Frontend Deployment

### Step 1: Build Frontend

```bash
# Navigate to frontend
cd /var/www/logistics-aggregator/frontend

# Install dependencies
npm install

# Build for production
npm run build

# Output will be in 'dist' directory
```

### Step 2: Configure NGINX for Frontend

```bash
# Create NGINX config
sudo nano /etc/nginx/sites-available/logistics-aggregator
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend (React App)
    root /var/www/logistics-aggregator/frontend/dist;
    index index.html;

    # Serve frontend files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to backend
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve uploaded images
    location /uploads {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/logistics-aggregator /etc/nginx/sites-enabled/

# Test NGINX configuration
sudo nginx -t

# Reload NGINX
sudo systemctl reload nginx
```

## 🔒 SSL/HTTPS Setup

### Using Certbot (Let's Encrypt)

```bash
# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot will automatically configure NGINX
# Test auto-renewal
sudo certbot renew --dry-run
```

### Updated NGINX Config (After SSL)

NGINX will be automatically updated by Certbot:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Frontend
    root /var/www/logistics-aggregator/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## ⚙️ Environment Configuration

### Backend Environment Variables

Update `/var/www/logistics-aggregator/backend/.env`:

```env
# Production settings
SECRET_KEY=generate-strong-random-key-here
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
CONTACT_EMAIL=admin@yourdomain.com
```

### Frontend Environment Variables

Create `/var/www/logistics-aggregator/frontend/.env.production`:

```env
VITE_API_BASE_URL=https://yourdomain.com
```

Rebuild frontend after changing environment variables:

```bash
cd /var/www/logistics-aggregator/frontend
npm run build
```

## 🔧 NGINX Configuration Details

### Complete NGINX Config

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

# Upstream backend
upstream backend {
    server localhost:8000;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (auto-configured by Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Frontend root
    root /var/www/logistics-aggregator/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API endpoints with rate limiting
    location /api/admin/login {
        limit_req zone=login_limit burst=3 nodelay;
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Uploaded files
    location /uploads {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Cache images
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## 🐛 Common Issues & Solutions

### Issue 1: Backend Not Starting

**Symptoms:**
- `systemctl status logistics-backend` shows failed
- No response from API

**Solutions:**
```bash
# Check logs
sudo journalctl -u logistics-backend -n 50

# Check Python path
which python3.11

# Verify virtual environment
ls -la /var/www/logistics-aggregator/backend/venv

# Check permissions
sudo chown -R www-data:www-data /var/www/logistics-aggregator/backend
```

### Issue 2: NGINX 502 Bad Gateway

**Symptoms:**
- Frontend loads but API calls fail
- 502 error in browser console

**Solutions:**
```bash
# Check if backend is running
sudo systemctl status logistics-backend

# Check backend logs
sudo journalctl -u logistics-backend -n 50

# Test backend directly
curl http://localhost:8000/api/public/settings

# Check NGINX error logs
sudo tail -f /var/log/nginx/error.log
```

### Issue 3: CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- API calls blocked

**Solutions:**
```bash
# Update backend .env
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Restart backend
sudo systemctl restart logistics-backend

# Check NGINX headers
curl -I https://yourdomain.com/api/public/settings
```

### Issue 4: Images Not Loading

**Symptoms:**
- Images return 404
- Uploaded files not accessible

**Solutions:**
```bash
# Check uploads directory
ls -la /var/www/logistics-aggregator/backend/storage/uploads

# Fix permissions
sudo chown -R www-data:www-data /var/www/logistics-aggregator/backend/storage
sudo chmod -R 755 /var/www/logistics-aggregator/backend/storage

# Verify NGINX config for /uploads
sudo nginx -t
```

### Issue 5: SSL Certificate Issues

**Symptoms:**
- Browser shows "Not Secure"
- SSL errors

**Solutions:**
```bash
# Renew certificate
sudo certbot renew

# Check certificate expiry
sudo certbot certificates

# Manually renew if needed
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com --force-renewal
```

### Issue 6: Frontend Not Updating

**Symptoms:**
- Changes not reflected
- Old version showing

**Solutions:**
```bash
# Rebuild frontend
cd /var/www/logistics-aggregator/frontend
npm run build

# Clear NGINX cache
sudo systemctl reload nginx

# Check build output
ls -la /var/www/logistics-aggregator/frontend/dist
```

## 💰 Cost Estimation

### VPS Option (Recommended)

**Monthly Costs:**
- VPS (2GB RAM, 1 vCPU): $12/month
- Domain: $10-15/year (~$1/month)
- SSL Certificate: Free (Let's Encrypt)
- **Total: ~$13/month**

### PaaS Option (Easier)

**Monthly Costs:**
- Frontend (Vercel/Netlify): Free tier
- Backend (Railway/Render): $5-10/month
- Domain: $10-15/year (~$1/month)
- **Total: ~$6-11/month**

### Cloud Platform (Enterprise)

**Monthly Costs:**
- AWS/GCP/Azure: $20-50/month
- Domain: $10-15/year
- **Total: ~$21-51/month**

## 🎯 Demo-Friendly Options

### Option 1: Quick Demo with Free Hosting

**Frontend: Vercel (Free)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel
```

**Backend: Render (Free Tier)**
- Create account at render.com
- Connect GitHub repository
- Select backend directory
- Set environment variables
- Deploy

**Pros:**
- Free
- Quick setup
- Automatic SSL
- Good for demos

**Cons:**
- Free tier limitations
- May sleep after inactivity

### Option 2: Railway (All-in-One)

**Deploy Both:**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy backend
cd backend
railway init
railway up

# Deploy frontend
cd ../frontend
railway init
railway up
```

**Cost:** $5/month (hobby plan)

**Pros:**
- Easy deployment
- Both services together
- Automatic SSL
- Good for demos

### Option 3: DigitalOcean App Platform

**Deploy:**
- Create account
- Connect GitHub
- Select repository
- Configure build settings
- Deploy

**Cost:** $5/month (basic plan)

**Pros:**
- Managed platform
- Automatic scaling
- SSL included
- Good support

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Domain purchased and DNS configured
- [ ] Server/VPS provisioned
- [ ] SSH access configured
- [ ] Repository cloned
- [ ] Environment variables prepared

### Backend Deployment
- [ ] Python 3.11+ installed
- [ ] Virtual environment created
- [ ] Dependencies installed
- [ ] .env file configured
- [ ] Storage directories created
- [ ] Systemd service created
- [ ] Service started and enabled
- [ ] Backend accessible on port 8000

### Frontend Deployment
- [ ] Node.js 18+ installed
- [ ] Dependencies installed
- [ ] Production build created
- [ ] Build output verified

### NGINX Configuration
- [ ] NGINX installed
- [ ] Site configuration created
- [ ] Site enabled
- [ ] Configuration tested
- [ ] NGINX reloaded

### SSL/HTTPS
- [ ] Certbot installed
- [ ] SSL certificate obtained
- [ ] Auto-renewal configured
- [ ] HTTPS working

### Testing
- [ ] Frontend loads correctly
- [ ] API endpoints working
- [ ] Images loading
- [ ] Admin login working
- [ ] Contact form working
- [ ] Email notifications working

### Post-Deployment
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Log rotation configured
- [ ] Firewall configured
- [ ] Documentation updated

## 🔄 Update/Deployment Process

### Updating Backend

```bash
# SSH into server
ssh user@yourdomain.com

# Navigate to project
cd /var/www/logistics-aggregator

# Pull latest changes
git pull origin main

# Activate virtual environment
cd backend
source venv/bin/activate

# Install new dependencies (if any)
pip install -r requirements.txt

# Restart service
sudo systemctl restart logistics-backend

# Check status
sudo systemctl status logistics-backend
```

### Updating Frontend

```bash
# Navigate to frontend
cd /var/www/logistics-aggregator/frontend

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Rebuild
npm run build

# Reload NGINX
sudo systemctl reload nginx
```

## 📊 Monitoring & Maintenance

### Log Monitoring

```bash
# Backend logs
sudo journalctl -u logistics-backend -f

# NGINX access logs
sudo tail -f /var/log/nginx/access.log

# NGINX error logs
sudo tail -f /var/log/nginx/error.log
```

### Health Checks

```bash
# Check backend
curl http://localhost:8000/api/public/settings

# Check frontend
curl https://yourdomain.com

# Check SSL
curl -I https://yourdomain.com
```

### Backup Strategy

```bash
# Backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/logistics-aggregator"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup data files
tar -czf $BACKUP_DIR/data_$DATE.tar.gz /var/www/logistics-aggregator/backend/storage/data

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/logistics-aggregator/backend/storage/uploads

# Keep only last 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

## 🚨 Security Checklist

- [ ] Strong SECRET_KEY in .env
- [ ] Admin password changed
- [ ] Firewall configured (UFW)
- [ ] SSH key authentication only
- [ ] Regular security updates
- [ ] SSL certificate valid
- [ ] CORS origins restricted
- [ ] Rate limiting enabled
- [ ] File upload restrictions
- [ ] Logs monitored

## 📞 Support & Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com
- **NGINX Docs**: https://nginx.org/en/docs/
- **Let's Encrypt**: https://letsencrypt.org
- **DigitalOcean Tutorials**: https://www.digitalocean.com/community/tags/nginx

---

**Last Updated:** 2025-12-31  
**Version:** 1.1.0


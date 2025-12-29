# Quick Start Guide

## Step 1: Install Node.js
Download and install from: https://nodejs.org/ (LTS version)

## Step 2: Install Dependencies
```bash
cd frontend
npm install
```

## Step 3: Start Frontend
```bash
npm run dev
```

## Step 4: Start Backend (in another terminal)
```bash
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

## Step 5: Open Browser
Visit: **http://localhost:5173**

## What You'll See

- **Home Page** (`/`) - Hero, How It Works, Partners, Why Choose Us
- **Pricing Calculator** (`/pricing`) - Calculate shipping costs
- **Tracking** (`/tracking`) - Track parcels
- **About Us** (`/about`) - About page
- **Contact** (`/contact`) - Contact information
- **Admin Login** (`/admin/login`) - Admin panel access

## Notes

- Frontend runs on port **5173**
- Backend runs on port **8000**
- Frontend automatically proxies API calls to backend
- All content is dynamic (fetched from backend APIs)


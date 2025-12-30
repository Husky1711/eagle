# Logistics Aggregator CMS - Backend API

FastAPI-based backend for a logistics aggregation platform with content management, pricing calculator, and email notifications.

## 🚀 Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Create .env file (see Configuration)
# Run server
uvicorn app.main:app --reload --port 8000
```

API Docs: `http://localhost:8000/docs`

## 📋 Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Setup](#setup)
- [API Endpoints](#api-endpoints)
- [Data Flow](#data-flow)
- [Configuration](#configuration)

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Frontend)                       │
│                    http://localhost:5173                     │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST API
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    FastAPI Backend                          │
│                  http://localhost:8000                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Public     │  │    Admin     │  │   Admin      │    │
│  │   Router     │  │    Router    │  │   Profile    │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                   │             │
│  ┌──────▼─────────────────▼───────────────────▼───────┐  │
│  │              Middleware Layer                       │  │
│  │  (CORS, Logging, Rate Limiting, Auth)              │  │
│  └──────────────────────┬────────────────────────────┘  │
│                         │                                  │
│  ┌──────────────────────▼────────────────────────────┐  │
│  │              Service Layer                         │  │
│  │  • Email Service (SMTP)                           │  │
│  │  • File Handler (Uploads/Media)                   │  │
│  │  • JSON Handler (Data Storage)                    │  │
│  └──────────────────────┬────────────────────────────┘  │
│                         │                                  │
└─────────────────────────┼──────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                 │
    ┌────▼────┐    ┌──────▼──────┐   ┌─────▼─────┐
    │  JSON   │    │   File      │   │   Email   │
    │ Storage │    │  Storage    │   │   SMTP    │
    │  (Data) │    │ (Uploads)   │   │  (Gmail)  │
    └─────────┘    └─────────────┘   └───────────┘
```

### Low-Level Request Flow

```
Client Request
     │
     ▼
┌─────────────────┐
│  CORS Middleware│
└────────┬────────┘
         │
     ┌───▼──────────┐
     │ Logging      │
     │ Middleware   │
     └───┬──────────┘
         │
     ┌───▼──────────┐
     │ Rate Limiting│
     │ (if needed)  │
     └───┬──────────┘
         │
     ┌───▼──────────┐
     │ Auth Check   │
     │ (if admin)   │
     └───┬──────────┘
         │
     ┌───▼──────────┐
     │   Router     │
     │  (Handler)   │
     └───┬──────────┘
         │
     ┌───▼──────────┐
     │   Service    │
     │  (Business   │
     │   Logic)     │
     └───┬──────────┘
         │
     ┌───▼──────────┐
     │ Data Access  │
     │ (JSON/File)  │
     └───┬──────────┘
         │
     ┌───▼──────────┐
     │   Response   │
     └──────────────┘
```

## ✨ Features

- **Content Management**: JSON-based CMS for pages, sections, and media
- **Pricing Calculator**: Rule-based shipping cost calculation
- **Courier Management**: CRUD operations for courier vendors
- **Email Service**: Gmail SMTP integration for contact form notifications
- **Admin Profile**: Profile management with avatar upload
- **Authentication**: JWT-based admin authentication
- **File Upload**: Image/media upload with HEIC conversion
- **Rate Limiting**: Protection against spam and abuse
- **Logging**: Structured logging with request tracking

## 🔧 Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Configuration

Create `.env` file:

```env
# Security
SECRET_KEY=your-secret-key-change-in-production
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
CONTACT_EMAIL=admin@example.com
```

### 3. Initialize Admin User

Default credentials:
- Username: `admin`
- Password: `admin123`

**Change password immediately!**

### 4. Run Server

```bash
uvicorn app.main:app --reload --port 8000
```

## 📡 API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/pages/{page_id}` | Get page content |
| GET | `/api/public/couriers` | List active couriers |
| POST | `/api/public/pricing/calculate` | Calculate shipping price |
| GET | `/api/public/tracking/{courier_id}/{tracking_id}` | Get tracking URL |
| GET | `/api/public/settings` | Get site settings |
| POST | `/api/public/contact` | Submit contact form |
| GET | `/api/public/uploads/{filename}` | Serve uploaded images |

### Admin Endpoints (JWT Required)

#### Authentication
- `POST /api/admin/login` - Admin login

#### Content Management
- `GET /api/admin/content/pages` - List all pages
- `GET /api/admin/content/{page_id}` - Get page for editing
- `PUT /api/admin/content/{page_id}` - Update page content

#### Media Management
- `POST /api/admin/media/upload` - Upload media file
- `GET /api/admin/media` - List media files
- `DELETE /api/admin/media/{file_id}` - Delete media file

#### Courier Management
- `GET /api/admin/couriers` - List couriers
- `POST /api/admin/couriers` - Create courier
- `PUT /api/admin/couriers/{courier_id}` - Update courier
- `DELETE /api/admin/couriers/{courier_id}` - Delete courier

#### Pricing Rules
- `GET /api/admin/pricing/rules` - List pricing rules
- `POST /api/admin/pricing/rules` - Create pricing rule
- `PUT /api/admin/pricing/rules/{rule_id}` - Update pricing rule
- `DELETE /api/admin/pricing/rules/{rule_id}` - Delete pricing rule

#### Admin Profile
- `GET /api/admin/profile` - Get admin profile
- `PUT /api/admin/profile` - Update profile
- `POST /api/admin/profile/password` - Change password
- `POST /api/admin/profile/avatar` - Upload avatar
- `DELETE /api/admin/profile/avatar` - Delete avatar

#### Settings
- `GET /api/admin/settings` - Get settings
- `PUT /api/admin/settings` - Update settings

## 🔄 Data Flow

### Contact Form Submission Flow

```
User Submits Form
       │
       ▼
┌──────────────┐
│ Frontend     │
│ Contact.jsx  │
└──────┬───────┘
       │ POST /api/public/contact
       ▼
┌──────────────┐
│ Rate Limiting│
│ Check        │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Honeypot     │
│ Check        │
└──────┬───────┘
       │
       ▼
┌──────────────┐      ┌──────────────┐
│ Send         │─────▶│ Admin Email  │
│ Acknowledgment│      │ Notification │
│ to Customer  │      │ to Admin     │
└──────────────┘      └──────────────┘
       │
       ▼
┌──────────────┐
│ Success      │
│ Response     │
└──────────────┘
```

### Pricing Calculation Flow

```
User Input (Weight, Distance)
       │
       ▼
┌──────────────┐
│ Validate     │
│ Inputs       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Load Pricing │
│ Rules        │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Match Rule   │
│ (Weight +    │
│  Distance)   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Calculate    │
│ Price        │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Return       │
│ Results      │
└──────────────┘
```

## 📁 Project Structure

```
backend/
├── app/
│   ├── routers/          # API route handlers
│   │   ├── public.py     # Public endpoints
│   │   ├── admin.py      # Admin endpoints
│   │   └── admin_profile.py  # Profile endpoints
│   ├── services/         # Business logic
│   │   └── email_service.py  # Email sending
│   ├── models/           # Pydantic models
│   ├── utils/            # Utilities
│   │   ├── file_handler.py
│   │   ├── json_handler.py
│   │   └── logger.py
│   ├── middleware/       # Middleware
│   ├── config.py         # Configuration
│   └── main.py           # FastAPI app
├── storage/
│   ├── data/             # JSON data files
│   └── uploads/           # Uploaded files
├── requirements.txt
└── .env                   # Environment variables
```

## 🛠️ Tech Stack

- **Framework**: FastAPI 0.104.1
- **Server**: Uvicorn
- **Auth**: JWT (python-jose), bcrypt
- **Validation**: Pydantic 2.5.0
- **Email**: aiosmtplib 3.0.1
- **Image**: Pillow 10.1.0, pillow-heif
- **Logging**: Loguru 0.7.2

## 📊 Data Storage

All content stored in JSON files (`storage/data/`):

- `pages.json` - Page content
- `sections.json` - Page sections
- `couriers.json` - Courier vendors
- `pricing_rules.json` - Pricing rules
- `settings.json` - Site settings
- `media.json` - Media references
- `admin.json` - Admin users

## 🔒 Security

- JWT authentication for admin endpoints
- Password hashing with bcrypt
- Rate limiting (login, contact form)
- CORS configuration
- Input validation with Pydantic
- Honeypot spam protection

## 📝 Logging

Structured JSON logs in `logs/`:
- `app/` - Application logs
- `error/` - Error logs
- `access/` - Access logs
- `admin/` - Admin action logs

## 🚀 Production Notes

- Change default admin password
- Use strong `SECRET_KEY`
- Configure CORS origins properly
- Set up proper email credentials
- Enable HTTPS
- Regular backups of JSON files
- Monitor logs for errors

## 📚 Documentation

- API Docs: `http://localhost:8000/docs` (Swagger UI)
- Email Setup: See `EMAIL_SETUP.md`
- Courier Logos: See `COURIER_LOGOS.md`

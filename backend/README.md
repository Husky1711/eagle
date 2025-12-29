# Logistics Aggregator CMS - Backend API

FastAPI backend for the Logistics Aggregator CMS system.

## Features

- RESTful API with FastAPI
- JSON-based content management
- JWT authentication for admin panel
- File upload and media management
- Pricing calculator with rule-based logic
- Courier management
- Analytics tracking

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Create Admin User

The default admin credentials are:
- Username: `admin`
- Password: `admin123` (change this!)

To set a new password, run:

```python
from app.auth import get_password_hash
print(get_password_hash("your_new_password"))
```

Then update `storage/data/admin.json` with the new hash.

### 3. Configure Environment

Create a `.env` file in the `backend` directory:

```env
SECRET_KEY=your-secret-key-here-change-in-production
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 4. Run the Server

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

API documentation (Swagger UI): `http://localhost:8000/docs`

## API Endpoints

### Public Endpoints

- `GET /api/public/pages/{page_id}` - Get page content
- `GET /api/public/couriers` - Get active couriers
- `POST /api/public/pricing/calculate` - Calculate shipping price
- `GET /api/public/tracking/{courier_id}/{tracking_id}` - Get tracking redirect URL
- `GET /api/public/settings` - Get site settings

### Admin Endpoints (Requires JWT)

- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/content/{page_id}` - Get page for editing
- `PUT /api/admin/content/{page_id}` - Update page content
- `POST /api/admin/media/upload` - Upload media file
- `GET /api/admin/media` - List media files
- `DELETE /api/admin/media/{file_id}` - Delete media file
- `GET /api/admin/couriers` - List couriers
- `POST /api/admin/couriers` - Create courier
- `PUT /api/admin/couriers/{courier_id}` - Update courier
- `DELETE /api/admin/couriers/{courier_id}` - Delete courier
- `GET /api/admin/pricing/rules` - List pricing rules
- `POST /api/admin/pricing/rules` - Create pricing rule
- `PUT /api/admin/pricing/rules/{rule_id}` - Update pricing rule
- `DELETE /api/admin/pricing/rules/{rule_id}` - Delete pricing rule
- `GET /api/admin/settings` - Get settings
- `PUT /api/admin/settings` - Update settings

## Data Structure

All content is stored in JSON files in `storage/data/`:

- `pages.json` - Page content
- `sections.json` - Page sections
- `couriers.json` - Courier vendors
- `pricing_rules.json` - Pricing calculation rules
- `settings.json` - Site-wide settings
- `media.json` - Media file references
- `analytics.json` - Usage analytics
- `admin.json` - Admin user credentials

## Security Notes

- Change the default admin password immediately
- Use a strong `SECRET_KEY` in production
- Configure CORS origins properly
- Consider rate limiting for production
- Backup JSON files regularly

## Development

The backend uses:
- FastAPI for the API framework
- Pydantic for data validation
- JWT for authentication
- bcrypt for password hashing
- PIL/Pillow for image processing


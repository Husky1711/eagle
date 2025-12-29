# Frontend Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
2. **npm** (comes with Node.js)

## Installation Steps

### 1. Install Node.js (if not installed)

- Download from: https://nodejs.org/
- Install the LTS version
- Verify installation:
  ```bash
  node --version
  npm --version
  ```

### 2. Install Dependencies

```bash
cd frontend
npm install
```

This will install:
- React 18
- Vite
- Tailwind CSS
- Framer Motion
- React Router
- Axios
- And all other dependencies

### 3. Start Development Server

```bash
npm run dev
```

The frontend will be available at: **http://localhost:5173**

### 4. Make Sure Backend is Running

The frontend expects the backend API at: **http://localhost:8000**

Start the backend:
```bash
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable components
│   ├── pages/          # Page components
│   ├── layouts/        # Layout components
│   ├── services/       # API services
│   ├── context/        # React context
│   └── App.jsx         # Main app
├── public/             # Static assets
└── package.json        # Dependencies
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Troubleshooting

### npm not found
- Install Node.js from nodejs.org
- Restart terminal after installation

### Port 5173 already in use
- Change port in `vite.config.js`
- Or kill the process using port 5173

### API connection errors
- Make sure backend is running on port 8000
- Check CORS settings in backend
- Verify proxy configuration in `vite.config.js`

## Next Steps

1. Install Node.js and npm
2. Run `npm install` in the frontend directory
3. Run `npm run dev` to start the server
4. Open http://localhost:5173 in your browser
5. Make sure backend is running on port 8000


# Logistics Aggregator - Frontend

Modern React-based frontend for a logistics aggregation platform with dynamic content management and responsive design.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Frontend: `http://localhost:5173`

## 📋 Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Setup](#setup)
- [Project Structure](#project-structure)
- [Component Flow](#component-flow)
- [Design System](#design-system)

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Application                         │
│                  http://localhost:5173                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │              React Router                            │  │
│  │  ┌──────────────┐  ┌──────────────┐                │  │
│  │  │   Public     │  │    Admin     │                │  │
│  │  │   Routes     │  │    Routes    │                │  │
│  │  └──────┬───────┘  └──────┬───────┘                │  │
│  └─────────┼──────────────────┼───────────────────────┘  │
│            │                  │                             │
│  ┌─────────▼──────────────────▼───────────────────────┐  │
│  │              Page Components                        │  │
│  │  • Home, Pricing, Tracking, About, Contact          │  │
│  │  • Admin Dashboard, Content Editor, etc.          │  │
│  └─────────┬──────────────────┬───────────────────────┘  │
│            │                  │                             │
│  ┌─────────▼──────────────────▼───────────────────────┐  │
│  │              Reusable Components                    │  │
│  │  • Header, Footer, HeroCarousel                    │  │
│  │  • ImagePicker, ImageSelector                      │  │
│  │  • Button, Card, Input, Container                  │  │
│  └─────────┬──────────────────┬───────────────────────┘  │
│            │                  │                             │
│  ┌─────────▼──────────────────▼───────────────────────┐  │
│  │              Services Layer                        │  │
│  │  • API Service (Axios)                            │  │
│  │  • Auth Context                                   │  │
│  └─────────┬──────────────────┬───────────────────────┘  │
└────────────┼──────────────────┼────────────────────────────┘
             │                  │
             │ HTTP Requests    │
             │                  │
┌────────────▼──────────────────▼────────────────────────────┐
│              Backend API                                     │
│          http://localhost:8000                             │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
App.jsx
├── PublicLayout
│   ├── Header
│   ├── Routes
│   │   ├── Home
│   │   │   ├── HeroCarousel
│   │   │   ├── Features
│   │   │   └── Partners
│   │   ├── Pricing
│   │   ├── Tracking
│   │   ├── About
│   │   └── Contact
│   └── Footer
│
└── AdminLayout (Protected)
    ├── AdminSidebar
    ├── AdminHeader
    └── Routes
        ├── AdminDashboard
        ├── ContentManager
        ├── ContentEditor
        ├── MediaManager
        ├── CourierManager
        ├── PricingRulesEditor
        ├── AdminProfile
        └── Settings
```

## ✨ Features

- **Dynamic Content**: CMS-driven content rendering
- **Responsive Design**: Mobile-first, works on all devices
- **Admin Panel**: Full content management interface
- **Image Management**: Upload, select, and manage images
- **Pricing Calculator**: Interactive shipping cost calculator
- **Contact Form**: Email notifications with acknowledgment
- **Tracking Integration**: Redirect to courier tracking pages
- **Animations**: Smooth transitions with Framer Motion
- **Authentication**: JWT-based admin authentication

## 🔧 Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

### 3. Build for Production

```bash
npm run build
```

Output in `dist/` directory

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/          # Reusable UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Container.jsx
│   │   │   └── Input.jsx
│   │   ├── public/          # Public site components
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── HeroCarousel.jsx
│   │   └── admin/           # Admin panel components
│   │       ├── AdminHeader.jsx
│   │       ├── AdminSidebar.jsx
│   │       ├── ImagePicker.jsx
│   │       ├── ImageSelector.jsx
│   │       └── MultiImageSelector.jsx
│   │
│   ├── pages/
│   │   ├── public/          # Public pages
│   │   │   ├── Home.jsx
│   │   │   ├── Pricing.jsx
│   │   │   ├── Tracking.jsx
│   │   │   ├── About.jsx
│   │   │   └── Contact.jsx
│   │   └── admin/          # Admin pages
│   │       ├── AdminLogin.jsx
│   │       ├── AdminDashboard.jsx
│   │       ├── ContentManager.jsx
│   │       ├── ContentEditor.jsx
│   │       ├── MediaManager.jsx
│   │       ├── CourierManager.jsx
│   │       ├── PricingRulesEditor.jsx
│   │       ├── AdminProfile.jsx
│   │       └── Settings.jsx
│   │
│   ├── layouts/
│   │   ├── PublicLayout.jsx
│   │   └── AdminLayout.jsx
│   │
│   ├── services/
│   │   └── api.js          # API service layer
│   │
│   ├── context/
│   │   └── AuthContext.jsx  # Authentication context
│   │
│   ├── App.jsx              # Main app component
│   └── main.jsx             # Entry point
│
├── public/                  # Static assets
├── package.json
└── vite.config.js           # Vite configuration
```

## 🔄 Component Flow

### Page Rendering Flow

```
User Visits Page
       │
       ▼
┌──────────────┐
│ React Router │
│ (Route Match)│
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Page         │
│ Component    │
│ (useEffect)  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ API Service  │
│ (Fetch Data) │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Backend API  │
│ (JSON Data)  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Render       │
│ Components   │
│ with Data    │
└──────────────┘
```

### Admin Content Editing Flow

```
Admin Opens Content Editor
       │
       ▼
┌──────────────┐
│ Load Page    │
│ Content      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Render Form  │
│ with Current │
│ Values       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Admin Edits  │
│ Content      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Save Changes │
│ (PUT Request)│
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Update UI    │
│ (Success)    │
└──────────────┘
```

### Image Upload Flow

```
Admin Selects Image
       │
       ▼
┌──────────────┐
│ ImagePicker  │
│ Component    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Validate     │
│ File Type    │
│ & Size       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ FormData     │
│ (POST)       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Backend      │
│ Upload       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Return URL   │
│ & Update UI  │
└──────────────┘
```

## 🎨 Design System

### Colors

- **Primary Gradient**: `#2563EB` → `#06B6D4` (Indigo to Cyan)
- **Success**: `#10B981` (Green)
- **Error**: `#EF4444` (Red)
- **Warning**: `#F59E0B` (Amber)
- **Neutral**: `#6B7280` (Gray)

### Typography

- **Font Family**: Inter (system fallback)
- **Headings**: Bold, various sizes
- **Body**: Regular, 16px base

### Spacing

- Consistent padding: `p-4`, `p-6`, `p-8`
- Margin utilities: `mb-4`, `mb-6`, `mb-8`
- Container max-width: `max-w-7xl`

### Components

- **Button**: Primary, secondary, outline variants
- **Card**: Elevated with shadow
- **Input**: Focus states with ring
- **Container**: Centered, responsive width

## 🛠️ Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Forms**: React Hook Form
- **Editor**: React Quill (WYSIWYG)
- **Icons**: Lucide React
- **File Upload**: React Dropzone

## 🔌 API Integration

All API calls go through `/api` proxy to backend:

```javascript
// Example API call
import { publicAPI } from './services/api'

// Get page content
const pageData = await publicAPI.getPage('home')

// Submit contact form
await publicAPI.submitContactForm({
  name, email, phone, message
})
```

## 🎯 Key Features

### Public Pages
- **Home**: Hero carousel, features, partners
- **Pricing**: Interactive calculator
- **Tracking**: Courier tracking redirect
- **About**: Company information
- **Contact**: Contact form with validation

### Admin Panel
- **Dashboard**: Statistics and overview
- **Content Manager**: List and edit pages
- **Content Editor**: Rich text editor with image support
- **Media Manager**: Upload and manage images
- **Courier Manager**: Manage courier vendors
- **Pricing Rules**: Configure pricing rules
- **Admin Profile**: Manage profile and avatar
- **Settings**: Site-wide settings

## 📱 Responsive Design

- **Mobile**: < 768px (single column, hamburger menu)
- **Tablet**: 768px - 1024px (2 columns)
- **Desktop**: > 1024px (full layout)

Breakpoints: `sm:`, `md:`, `lg:`, `xl:`

## 🚀 Production Build

```bash
npm run build
```

- Optimized bundle
- Code splitting
- Asset optimization
- Minified CSS/JS

## 🔒 Authentication

- JWT token stored in `localStorage`
- Protected routes with `ProtectedRoute` component
- Auto-redirect to login if unauthorized
- Token refresh on API calls

## 📝 Environment Variables

Create `.env` file (if needed):

```env
VITE_API_BASE_URL=http://localhost:8000
```

## 🐛 Development Tips

- Hot reload enabled in dev mode
- API proxy configured in `vite.config.js`
- Error boundaries for error handling
- Console logs for debugging

## 📚 Additional Documentation

- Backend API: See `../backend/README.md`
- Quick Start: See `QUICK_START.md`
- Setup Guide: See `SETUP.md`

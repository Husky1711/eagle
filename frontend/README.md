# Logistics Aggregator - Frontend

React + Vite frontend for the Logistics Aggregator CMS.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Framer Motion (animations)
- React Router
- Axios
- React Hook Form
- React Quill (WYSIWYG editor)
- React Dropzone (file uploads)
- Lucide React (icons)

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/          # Reusable UI components
│   │   ├── public/          # Public site components
│   │   └── admin/           # Admin panel components
│   ├── pages/
│   │   ├── public/          # Public pages
│   │   └── admin/           # Admin pages
│   ├── layouts/             # Layout components
│   ├── services/            # API services
│   ├── hooks/               # Custom hooks
│   ├── context/             # React context
│   └── utils/               # Utility functions
├── public/                  # Static assets
└── package.json
```

## Design System

- **Primary Gradient**: Indigo Blue (#2563EB) → Cyan (#06B6D4)
- **Typography**: Inter font family
- **Spacing**: Consistent padding and margins
- **Animations**: Framer Motion for smooth transitions

## Development

The frontend runs on `http://localhost:5173` and proxies API requests to `http://localhost:8000/api`.


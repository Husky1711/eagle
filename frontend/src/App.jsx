import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PublicLayout from './layouts/PublicLayout'
import AdminLayout from './layouts/AdminLayout'

// Public Pages
import Home from './pages/public/Home'
import Pricing from './pages/public/Pricing'
import Tracking from './pages/public/Tracking'
import About from './pages/public/About'
import Contact from './pages/public/Contact'

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import ContentManager from './pages/admin/ContentManager'
import ContentEditor from './pages/admin/ContentEditor'
import MediaManager from './pages/admin/MediaManager'
import CourierManager from './pages/admin/CourierManager'
import PricingRulesEditor from './pages/admin/PricingRulesEditor'
import Settings from './pages/admin/Settings'
import ProtectedRoute from './components/common/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="tracking" element={<Tracking />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="content" element={<ContentManager />} />
            <Route path="content/:pageId" element={<ContentEditor />} />
            <Route path="media" element={<MediaManager />} />
            <Route path="couriers" element={<CourierManager />} />
            <Route path="pricing" element={<PricingRulesEditor />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App


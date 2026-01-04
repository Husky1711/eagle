import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Toaster } from 'react-hot-toast'
import PublicLayout from './layouts/PublicLayout'
import AdminLayout from './layouts/AdminLayout'

// Public Pages
import Home from './pages/public/Home'
import Pricing from './pages/public/Pricing'
import Tracking from './pages/public/Tracking'
import About from './pages/public/About'
import Services from './pages/public/Services'
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
import AdminProfile from './pages/admin/AdminProfile'
import GlobalSettings from './pages/admin/GlobalSettings'
import ChatManager from './pages/admin/ChatManager'
import ProtectedRoute from './components/common/ProtectedRoute'
import { SettingsProvider } from './context/SettingsContext'

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <SettingsProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="pricing" element={<Pricing />} />
              <Route path="tracking" element={<Tracking />} />
              <Route path="about" element={<About />} />
              <Route path="services" element={<Services />} />
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
              <Route path="profile" element={<AdminProfile />} />
              <Route path="global-settings" element={<GlobalSettings />} />
              <Route path="chat" element={<ChatManager />} />
            </Route>
          </Routes>
        </Router>
      </SettingsProvider>
    </AuthProvider>
  )
}

export default App


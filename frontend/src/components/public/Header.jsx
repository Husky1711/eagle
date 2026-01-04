import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useSettings } from '../../context/SettingsContext'

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  // Use global settings
  const { settings, loading } = useSettings() // Assuming import is added above
  const header = settings?.header || {}
  const styles = header.styles || {}

  const navItems = header.menuItems || [
    { path: '/', label: 'Home' },
    { path: '/pricing', label: 'Pricing' },
    { path: '/tracking', label: 'Tracking' },
    { path: '/services', label: 'Services' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
  ]
  const cta = header.ctaButton || { text: 'Calculate Price', url: '/pricing', enabled: true }

  const isActive = (path) => location.pathname === path

  // Dynamic Styles
  const headerStyle = {
    backgroundColor: styles.bgColor || 'rgba(255, 255, 255, 0.95)',
    borderBottomColor: styles.borderColor || 'rgb(229, 229, 229)',
    fontFamily: styles.fontFamily || 'inherit'
  }
  const linkStyle = (active) => ({
    color: active ? (styles.activeColor || '#ea580c') : (styles.textColor || '#525252')
  })
  const buttonStyle = {
    background: styles.buttonBgColor || 'linear-gradient(to right, #ea580c, #ca8a04)',
    color: styles.buttonTextColor || '#ffffff'
  }

  const getLogoUrl = (logo) => {
    if (!logo) return "/logo.png"
    if (logo.startsWith('http')) return logo
    return `http://localhost:8000/uploads/${logo}`
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-sm border-b transition-colors duration-300" style={headerStyle}>
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img
              src={getLogoUrl(header.logo)}
              alt="Eagle Logistics"
              className="h-12 object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="text-sm font-medium transition-colors duration-200 hover:opacity-80"
                style={linkStyle(isActive(item.path))}
                target={item.target || "_self"}
              >
                {item.label}
              </Link>
            ))}

            {cta.enabled && (
              <Link
                to={cta.url}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-shadow"
                style={buttonStyle}
              >
                {cta.text}
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            style={{ color: styles.textColor || '#525252' }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t"
            style={{ borderColor: styles.borderColor || 'rgb(229, 229, 229)' }}
          >
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium transition-colors hover:opacity-80"
                  style={linkStyle(isActive(item.path))}
                  target={item.target || "_self"}
                >
                  {item.label}
                </Link>
              ))}

              {cta.enabled && (
                <Link
                  to={cta.url}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 rounded-lg text-center font-medium"
                  style={buttonStyle}
                >
                  {cta.text}
                </Link>
              )}
            </div>
          </motion.nav>
        )}
      </div>
    </header>
  )
}

export default Header


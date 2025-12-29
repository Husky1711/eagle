import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/pricing', label: 'Pricing' },
    { path: '/tracking', label: 'Tracking' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-neutral-200">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold gradient-text">LogiSmart</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  text-sm font-medium transition-colors duration-200
                  ${isActive(item.path)
                    ? 'text-primary-500'
                    : 'text-neutral-600 hover:text-primary-500'
                  }
                `}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/pricing"
              className="gradient-bg text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-shadow"
            >
              Calculate Price
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-neutral-600"
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
            className="md:hidden py-4 border-t border-neutral-200"
          >
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    text-base font-medium transition-colors
                    ${isActive(item.path)
                      ? 'text-primary-500'
                      : 'text-neutral-600'
                    }
                  `}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="gradient-bg text-white px-4 py-2 rounded-lg text-center font-medium"
              >
                Calculate Price
              </Link>
            </div>
          </motion.nav>
        )}
      </div>
    </header>
  )
}

export default Header


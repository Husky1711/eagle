import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Mail, 
  Phone, 
  MapPin, 
  MessageCircle, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram,
  Calculator,
  Package,
  Search,
  ArrowRight,
  Clock,
  Shield,
  TrendingUp,
  Home,
  Info,
  Contact
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { publicAPI } from '../../services/api'
import Container from '../common/Container'

const Footer = () => {
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await publicAPI.getSettings()
        setSettings(response.data)
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      }
    }
    fetchSettings()
  }, [])

  const contact = settings?.contact || {}
  const social = settings?.social || {}
  const site = settings?.site || {}
  const siteName = site.name || 'LogiSmart'

  const handleWhatsApp = () => {
    const phone = contact.whatsapp?.replace(/[^0-9]/g, '') || ''
    if (phone) {
      window.open(`https://wa.me/${phone}`, '_blank')
    }
  }

  const socialLinks = [
    { icon: Facebook, url: social.facebook, label: 'Facebook', color: 'hover:text-blue-400' },
    { icon: Twitter, url: social.twitter, label: 'Twitter', color: 'hover:text-blue-300' },
    { icon: Linkedin, url: social.linkedin, label: 'LinkedIn', color: 'hover:text-blue-500' },
    { icon: Instagram, url: social.instagram, label: 'Instagram', color: 'hover:text-pink-400' },
  ].filter(link => link.url)

  return (
    <footer className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-neutral-300 mt-auto relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-500 rounded-full blur-3xl"></div>
      </div>

      <Container className="relative z-10">
        {/* Main Footer Content */}
        <div className="py-16 lg:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Company Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Link to="/" className="inline-block mb-6">
                <h3 className="text-2xl font-bold text-white gradient-text">
                  {siteName}
                </h3>
              </Link>
              <p className="text-body-sm text-neutral-400 mb-6 leading-relaxed">
                Your trusted logistics aggregation platform. Compare multiple courier partners and get the best shipping rates with fast, reliable delivery.
              </p>
              
              {/* Social Media Icons */}
              {socialLinks.length > 0 && (
                <div className="flex items-center gap-4">
                  {socialLinks.map((social, index) => {
                    const Icon = social.icon
                    return (
                      <motion.a
                        key={index}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.15, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className={`w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center text-neutral-400 transition-colors ${social.color} border border-neutral-700 hover:border-primary-500`}
                        aria-label={social.label}
                      >
                        <Icon size={18} />
                      </motion.a>
                    )
                  })}
                </div>
              )}
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h4 className="text-white font-semibold text-lg mb-6 flex items-center gap-2">
                <ArrowRight size={18} className="text-primary-500" />
                Quick Links
              </h4>
              <ul className="space-y-3">
                {[
                  { path: '/', label: 'Home', icon: Home },
                  { path: '/pricing', label: 'Pricing Calculator', icon: Calculator },
                  { path: '/tracking', label: 'Track Parcel', icon: Search },
                  { path: '/about', label: 'About Us', icon: Info },
                  { path: '/contact', label: 'Contact Us', icon: Contact },
                ].map((link, index) => {
                  const Icon = link.icon
                  return (
                    <motion.li
                      key={index}
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link 
                        to={link.path} 
                        className="text-body-sm text-neutral-400 hover:text-primary-400 transition-colors flex items-center gap-2 group"
                      >
                        <Icon size={14} className="text-primary-500 group-hover:translate-x-1 transition-transform" />
                        <span>{link.label}</span>
                      </Link>
                    </motion.li>
                  )
                })}
              </ul>
            </motion.div>

            {/* Services */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h4 className="text-white font-semibold text-lg mb-6 flex items-center gap-2">
                <Package size={18} className="text-primary-500" />
                Our Services
              </h4>
              <ul className="space-y-3">
                {[
                  { icon: Calculator, label: 'Price Comparison', desc: 'Compare rates from multiple couriers' },
                  { icon: TrendingUp, label: 'Best Rates', desc: 'Get the lowest shipping costs' },
                  { icon: Search, label: 'Parcel Tracking', desc: 'Track across all courier services' },
                  { icon: Shield, label: 'Secure & Reliable', desc: 'Trusted logistics solutions' },
                ].map((service, index) => {
                  const Icon = service.icon
                  return (
                    <motion.li
                      key={index}
                      whileHover={{ x: 5 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-start gap-3"
                    >
                      <Icon size={16} className="text-primary-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-body-sm text-neutral-300 font-medium">{service.label}</p>
                        <p className="text-xs text-neutral-500">{service.desc}</p>
                      </div>
                    </motion.li>
                  )
                })}
              </ul>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h4 className="text-white font-semibold text-lg mb-6 flex items-center gap-2">
                <Mail size={18} className="text-primary-500" />
                Contact Us
              </h4>
              <ul className="space-y-4">
                {contact.address && (
                  <li className="flex items-start gap-3">
                    <MapPin size={18} className="text-primary-500 mt-1 flex-shrink-0" />
                    <p className="text-body-sm text-neutral-400 leading-relaxed">
                      {contact.address}
                    </p>
                  </li>
                )}
                {contact.phone && (
                  <li className="flex items-center gap-3">
                    <Phone size={18} className="text-primary-500 flex-shrink-0" />
                    <a 
                      href={`tel:${contact.phone}`}
                      className="text-body-sm text-neutral-400 hover:text-primary-400 transition-colors"
                    >
                      {contact.phone}
                    </a>
                  </li>
                )}
                {contact.email && (
                  <li className="flex items-center gap-3">
                    <Mail size={18} className="text-primary-500 flex-shrink-0" />
                    <a 
                      href={`mailto:${contact.email}`}
                      className="text-body-sm text-neutral-400 hover:text-primary-400 transition-colors break-all"
                    >
                      {contact.email}
                    </a>
                  </li>
                )}
                {contact.whatsapp && (
                  <li className="flex items-center gap-3">
                    <MessageCircle size={18} className="text-green-400 flex-shrink-0" />
                    <motion.button
                      onClick={handleWhatsApp}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-body-sm text-green-400 hover:text-green-300 transition-colors flex items-center gap-2"
                    >
                      Chat on WhatsApp
                      <ArrowRight size={14} />
                    </motion.button>
                  </li>
                )}
                <li className="flex items-center gap-3 pt-2">
                  <Clock size={18} className="text-primary-500 flex-shrink-0" />
                  <div>
                    <p className="text-body-sm text-neutral-400">Mon - Sat: 9:00 AM - 6:00 PM</p>
                    <p className="text-xs text-neutral-500">Sunday: Closed</p>
                  </div>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* Newsletter Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="border-t border-neutral-800 pt-12 mb-12"
          >
            <div className="max-w-2xl mx-auto text-center">
              <h4 className="text-white font-semibold text-xl mb-3">Stay Updated</h4>
              <p className="text-body-sm text-neutral-400 mb-6">
                Subscribe to our newsletter for the latest shipping deals and logistics updates.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 gradient-bg text-white rounded-lg font-medium flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  Subscribe
                  <ArrowRight size={18} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-neutral-800 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4 text-body-sm text-neutral-400">
              <p>&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <Link to="/about" className="hover:text-primary-400 transition-colors">
                  Privacy Policy
                </Link>
                <span className="text-neutral-600">•</span>
                <Link to="/contact" className="hover:text-primary-400 transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-2 text-body-sm text-neutral-500">
              <span>Made with</span>
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-red-500"
              >
                ❤️
              </motion.span>
              <span>in India</span>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  )
}

export default Footer


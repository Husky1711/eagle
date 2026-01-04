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
  Youtube, // Added Youtube
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
import { useSettings } from '../../context/SettingsContext'

const Footer = () => {
  // Use global settings
  const { settings } = useSettings() // Using context instead of local fetch

  // Scraped Defaults
  const contact = settings?.contact || {
    address: '15/2, 6th Cross, 1St Main Road, Sampangi Rama Nagar, Near Corporation Circle, Bangalore: 560027',
    phone: '+91 98864 96920',
    email: 'info@eaglelogistics.in',
    whatsapp: '919886496920'
  }
  const social = settings?.social || {}
  const site = settings?.site || {}
  const siteName = site.name || 'Eagle Logistics'

  // Footer Specific Settings
  const footerSettings = settings?.footer || {}
  const styles = footerSettings.styles || {}
  const sections = footerSettings.sections || []

  // Dynamic Styles
  const footerStyle = {
    background: styles.bgColor ? styles.bgColor : `linear-gradient(to bottom right, ${styles.gradientFrom || '#171717'}, ${styles.gradientTo || '#262626'})`,
    color: styles.textColor || '#d4d4d4'
  }
  const headingStyle = {
    color: styles.headingColor || '#ffffff'
  }

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
    { icon: Youtube, url: social.youtube, label: 'Youtube', color: 'hover:text-red-500' },
  ].filter(link => link.url)

  // Helper to resolve icon string to Component
  const getIcon = (iconName) => {
    const icons = {
      Home, Calculator, Search, Info, Contact,
      Package, TrendingUp, Shield, Clock, MapPin, Phone, Mail, MessageCircle
    }
    return icons[iconName] || ArrowRight
  }

  return (
    <footer className="mt-auto relative overflow-hidden" style={footerStyle}>
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-500 rounded-full blur-3xl"></div>
      </div>

      <Container className="relative z-10">
        {/* Main Footer Content */}
        <div className="py-16 lg:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Company Info (Always First) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Link to="/" className="inline-block mb-6">
                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400" style={headingStyle}>
                  {siteName}
                </h3>
              </Link>
              <p className="text-body-sm mb-6 leading-relaxed" style={{ color: styles.textColor || '#a3a3a3' }}>
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
                        className={`w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center transition-colors ${social.color} border border-white/10 hover:border-primary-500`}
                        style={{ color: styles.textColor || '#a3a3a3' }}
                        aria-label={social.label}
                      >
                        <Icon size={18} />
                      </motion.a>
                    )
                  })}
                </div>
              )}
            </motion.div>

            {/* Dynamic Sections (Quick Links, Services, etc.) */}
            {sections.map((section, idx) => (
              <motion.div
                key={section.id || idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 * (idx + 1) }}
              >
                <h4 className="font-semibold text-lg mb-6 flex items-center gap-2" style={headingStyle}>
                  {/* Optional Section Icon could go here */}
                  <ArrowRight size={18} className="text-primary-500" />
                  {section.title}
                </h4>

                <ul className="space-y-3">
                  {section.items?.map((item, itemIdx) => {
                    const ItemIcon = getIcon(item.icon)

                    // Type: Features (with description)
                    if (section.type === 'features') {
                      return (
                        <motion.li
                          key={itemIdx}
                          whileHover={{ x: 5 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-start gap-3"
                        >
                          <ItemIcon size={16} className="text-primary-500 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-body-sm font-medium" style={{ color: styles.textColor || '#d4d4d4' }}>{item.label}</p>
                            {item.desc && <p className="text-xs opacity-70">{item.desc}</p>}
                          </div>
                        </motion.li>
                      )
                    }

                    // Type: Links (Standard)
                    return (
                      <motion.li
                        key={itemIdx}
                        whileHover={{ x: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Link
                          to={item.path || '#'}
                          className="text-body-sm hover:text-primary-400 transition-colors flex items-center gap-2 group"
                          style={{ color: styles.textColor || '#a3a3a3' }}
                        >
                          <ItemIcon size={14} className="text-primary-500 group-hover:translate-x-1 transition-transform" />
                          <span>{item.label}</span>
                        </Link>
                      </motion.li>
                    )
                  })}
                </ul>
              </motion.div>
            ))}

            {/* Contact Information (Always Last) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h4 className="font-semibold text-lg mb-6 flex items-center gap-2" style={headingStyle}>
                <Mail size={18} className="text-primary-500" />
                Contact Us
              </h4>
              <ul className="space-y-4">
                {contact.address && (
                  <li className="flex items-start gap-3">
                    <MapPin size={18} className="text-primary-500 mt-1 flex-shrink-0" />
                    <p className="text-body-sm leading-relaxed" style={{ color: styles.textColor || '#a3a3a3' }}>
                      {contact.address}
                    </p>
                  </li>
                )}
                {contact.phone && (
                  <li className="flex items-center gap-3">
                    <Phone size={18} className="text-primary-500 flex-shrink-0" />
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-body-sm hover:text-primary-400 transition-colors"
                      style={{ color: styles.textColor || '#a3a3a3' }}
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
                      className="text-body-sm hover:text-primary-400 transition-colors break-all"
                      style={{ color: styles.textColor || '#a3a3a3' }}
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
                    <p className="text-body-sm" style={{ color: styles.textColor || '#a3a3a3' }}>Mon - Sat: 9:00 AM - 6:00 PM</p>
                    <p className="text-xs opacity-70">Sunday: Closed</p>
                  </div>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* Newsletter Section - Keep static or make toggleable? Keeping static for now as per user request to edit visual/links primarily */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="border-t pt-12 mb-12"
            style={{ borderColor: styles.borderColor || 'rgba(255,255,255,0.1)' }}
          >
            <div className="max-w-2xl mx-auto text-center">
              <h4 className="font-semibold text-xl mb-3" style={headingStyle}>Stay Updated</h4>
              <p className="text-body-sm mb-6" style={{ color: styles.textColor || '#a3a3a3' }}>
                Subscribe to our newsletter for the latest shipping deals and logistics updates.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 gradient-bg text-white rounded-lg font-medium flex items-center justify-center gap-2 whitespace-nowrap"
                  style={{ background: styles.accentColor ? styles.accentColor : undefined }}
                >
                  Subscribe
                  <ArrowRight size={18} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t py-6" style={{
          borderColor: styles.borderColor || 'rgba(255,255,255,0.1)',
          backgroundColor: styles.bottomBarBgColor || 'transparent'
        }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4 text-body-sm" style={{ color: styles.bottomBarTextColor || '#737373' }}>
              <p>&copy; {new Date().getFullYear()} {siteName}. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <Link to="/about" className="hover:text-primary-400 transition-colors">
                  Privacy Policy
                </Link>
                <span className="opacity-50">•</span>
                <Link to="/contact" className="hover:text-primary-400 transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-2 text-body-sm" style={{ color: styles.bottomBarTextColor || '#737373' }}>
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


import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Save,
  Settings as SettingsIcon,
  Globe,
  Mail,
  MapPin,
  Phone,
  Share2,
  BarChart3,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Layout
} from 'lucide-react'
import Container from '../../components/common/Container'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import ImageSelector from '../../components/admin/ImageSelector'
import { adminAPI } from '../../services/api'

// Tab Component
const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 ${active
      ? 'bg-primary-50 text-primary-700 font-medium shadow-sm'
      : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700'
      }`}
  >
    <Icon size={20} className={active ? 'text-primary-600' : 'text-neutral-400'} />
    <span className="text-sm">{label}</span>
    {active && (
      <motion.div
        layoutId="activeTabIndicator"
        className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500"
      />
    )}
  </button>
)

const Settings = () => {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getSettings()
      // Ensure structure exists
      const data = response.data || {}
      setSettings({
        ...data,
        site: data.site || {},
        contact: data.contact || {},
        social: data.social || {},
        analytics: data.analytics || {}
      })
    } catch (error) {
      setError('Failed to load settings')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      await adminAPI.updateSettings(settings)
      setSuccess('Settings saved successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (path, value) => {
    setSettings(prev => {
      const newSettings = { ...prev }
      const keys = path.split('.')
      let current = newSettings

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {}
        current = current[keys[i]]
      }

      current[keys[keys.length - 1]] = value
      return newSettings
    })
  }

  if (loading) {
    return (
      <Container>
        <div className="py-20 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </Container>
    )
  }

  if (!settings) return null

  const tabs = [
    { id: 'general', label: 'General & Identity', icon: Globe },
    { id: 'contact', label: 'Contact Details', icon: MapPin },
    { id: 'social', label: 'Social Media', icon: Share2 },
    { id: 'analytics', label: 'Analytics & SEO', icon: BarChart3 }
  ]

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <Container>
        <div className="py-8 space-y-8">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">System Settings</h1>
              <p className="text-neutral-500 mt-1">Configure global site parameters and integrations</p>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 border-0 rounded-xl px-6 py-2.5 flex items-center gap-2 transform transition-all hover:-translate-y-0.5"
            >
              {saving ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={18} />
              )}
              <span className="font-semibold">{saving ? 'Saving...' : 'Save Changes'}</span>
            </Button>
          </div>

          {/* Feedback Messages */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 mb-6">
                  <AlertCircle size={20} />
                  {error}
                </div>
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl flex items-center gap-3 mb-6">
                  <CheckCircle2 size={20} />
                  {success}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid lg:grid-cols-4 gap-8 items-start">

            {/* Sidebar Navigation */}
            <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-neutral-200 p-3 space-y-1 sticky top-24">
              {tabs.map(tab => (
                <TabButton
                  key={tab.id}
                  active={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  icon={tab.icon}
                  label={tab.label}
                />
              ))}
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">

                {/* General Tab */}
                {/* General Tab */}
                {activeTab === 'general' && (
                  <motion.div
                    key="general"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <Card>
                      <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
                        <Layout className="text-primary-500" size={24} />
                        Brand Identity
                      </h2>

                      {/* Logo & Favicon Row */}
                      <div className="grid md:grid-cols-2 gap-8 pb-8 border-b border-neutral-100">
                        <div>
                          <ImageSelector
                            label="Site Logo"
                            value={settings.site?.logo || ''}
                            onChange={(val) => updateSetting('site.logo', val)}
                            helperText="Main logo for header (PNG/SVG recommended)"
                          />
                        </div>
                        <div>
                          <ImageSelector
                            label="Favicon"
                            value={settings.site?.favicon || ''}
                            onChange={(val) => updateSetting('site.favicon', val)}
                            helperText="Browser tab icon (32x32px)"
                          />
                        </div>
                      </div>

                      {/* Site Details Row */}
                      <div className="grid md:grid-cols-2 gap-6 pt-6">
                        <Input
                          label="Site Name"
                          value={settings.site?.name || ''}
                          onChange={(e) => updateSetting('site.name', e.target.value)}
                          placeholder="e.g. Eagle Logistics"
                        />
                        <Input
                          label="Site URL"
                          value={settings.site?.url || ''}
                          onChange={(e) => updateSetting('site.url', e.target.value)}
                          placeholder="https://yourwebsite.com"
                          icon={Globe}
                        />
                      </div>
                    </Card>
                  </motion.div>
                )}

                {/* Contact Tab */}
                {activeTab === 'contact' && (
                  <motion.div
                    key="contact"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <Card>
                      <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
                        <MapPin className="text-primary-500" size={24} />
                        Contact Information
                      </h2>
                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <Input
                          label="Phone Number"
                          icon={Phone}
                          value={settings.contact?.phone || ''}
                          onChange={(e) => updateSetting('contact.phone', e.target.value)}
                        />
                        <Input
                          label="Email Address"
                          icon={Mail}
                          type="email"
                          value={settings.contact?.email || ''}
                          onChange={(e) => updateSetting('contact.email', e.target.value)}
                        />
                        <Input
                          label="WhatsApp Number"
                          value={settings.contact?.whatsapp || ''}
                          onChange={(e) => updateSetting('contact.whatsapp', e.target.value)}
                          placeholder="+91..."
                        />
                        <Input
                          label="Physical Address"
                          value={settings.contact?.address || ''}
                          onChange={(e) => updateSetting('contact.address', e.target.value)}
                        />
                      </div>

                      <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Google Maps Embed URL</label>
                        <textarea
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4 text-sm font-mono text-neutral-600"
                          rows="3"
                          placeholder='<iframe src="https://www.google.com/maps/embed?..."></iframe>'
                          value={settings.contact?.google_maps_embed || ''}
                          onChange={(e) => updateSetting('contact.google_maps_embed', e.target.value)}
                        />

                        {/* Live Map Preview */}
                        {settings.contact?.google_maps_embed && (
                          <div className="rounded-lg overflow-hidden h-64 bg-neutral-200 border border-neutral-300 relative">
                            <div className="absolute inset-0 flex items-center justify-center text-neutral-400 z-0">Loading Map...</div>
                            <div
                              className="relative z-10 w-full h-full"
                              dangerouslySetInnerHTML={{
                                __html: settings.contact.google_maps_embed.replace(/width="[^"]*"/, 'width="100%"').replace(/height="[^"]*"/, 'height="100%"')
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                )}

                {/* Social Tab */}
                {activeTab === 'social' && (
                  <motion.div
                    key="social"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <Card>
                      <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
                        <Share2 className="text-primary-500" size={24} />
                        Social Media Links
                      </h2>
                      <div className="grid md:grid-cols-2 gap-6">
                        {['facebook', 'twitter', 'linkedin', 'instagram'].map(platform => (
                          <div key={platform}>
                            <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1.5 ml-1">
                              {platform}
                            </label>
                            <Input
                              value={settings.social?.[platform] || ''}
                              onChange={(e) => updateSetting(`social.${platform}`, e.target.value)}
                              placeholder={`https://${platform}.com/...`}
                            />
                          </div>
                        ))}
                      </div>
                    </Card>
                  </motion.div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                  <motion.div
                    key="analytics"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <Card>
                      <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
                        <BarChart3 className="text-primary-500" size={24} />
                        Analytics Integration
                      </h2>
                      <div className="max-w-xl">
                        <Input
                          label="Google Analytics Measurement ID"
                          placeholder="G-XXXXXXXXXX"
                          value={settings.analytics?.google_analytics_id || ''}
                          onChange={(e) => updateSetting('analytics.google_analytics_id', e.target.value)}
                          helperText="Format: G- followed by 10 characters"
                        />
                      </div>
                    </Card>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}

export default Settings

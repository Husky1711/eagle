import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, Settings as SettingsIcon } from 'lucide-react'
import Container from '../../components/common/Container'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import { adminAPI } from '../../services/api'

const Settings = () => {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getSettings()
      setSettings(response.data)
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
      
      setSuccess('Settings saved successfully!')
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
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        </div>
      </Container>
    )
  }

  if (!settings) {
    return (
      <Container>
        <div className="py-20 text-center">
          <p className="text-neutral-600">Failed to load settings</p>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-h1">Settings</h1>
            <p className="text-neutral-600 mt-1">Manage site settings and preferences</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save size={20} className="mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-200 text-error-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-success-50 border border-success-200 text-success-600 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        <div className="space-y-6">
          {/* Contact Information */}
          <Card>
            <h2 className="text-h3 mb-6 flex items-center">
              <SettingsIcon size={24} className="mr-2" />
              Contact Information
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Address"
                value={settings.contact?.address || ''}
                onChange={(e) => updateSetting('contact.address', e.target.value)}
              />
              
              <Input
                label="Phone"
                value={settings.contact?.phone || ''}
                onChange={(e) => updateSetting('contact.phone', e.target.value)}
              />
              
              <Input
                label="Email"
                type="email"
                value={settings.contact?.email || ''}
                onChange={(e) => updateSetting('contact.email', e.target.value)}
              />
              
              <Input
                label="WhatsApp Number"
                value={settings.contact?.whatsapp || ''}
                onChange={(e) => updateSetting('contact.whatsapp', e.target.value)}
                placeholder="+1234567890"
                helperText="Include country code (e.g., +91 for India)"
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Google Maps Embed URL
              </label>
              <textarea
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                rows="3"
                value={settings.contact?.google_maps_embed || ''}
                onChange={(e) => updateSetting('contact.google_maps_embed', e.target.value)}
                placeholder="https://www.google.com/maps/embed?pb=..."
              />
              <p className="text-sm text-neutral-500 mt-2">
                Get embed URL from Google Maps → Share → Embed a map
              </p>
            </div>
          </Card>

          {/* Site Information */}
          <Card>
            <h2 className="text-h3 mb-6">Site Information</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Site Name"
                value={settings.site?.name || ''}
                onChange={(e) => updateSetting('site.name', e.target.value)}
              />
              
              <Input
                label="Site URL"
                value={settings.site?.url || ''}
                onChange={(e) => updateSetting('site.url', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </Card>

          {/* Social Media */}
          <Card>
            <h2 className="text-h3 mb-6">Social Media Links</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Facebook"
                value={settings.social?.facebook || ''}
                onChange={(e) => updateSetting('social.facebook', e.target.value)}
                placeholder="https://facebook.com/yourpage"
              />
              
              <Input
                label="Twitter"
                value={settings.social?.twitter || ''}
                onChange={(e) => updateSetting('social.twitter', e.target.value)}
                placeholder="https://twitter.com/yourhandle"
              />
              
              <Input
                label="LinkedIn"
                value={settings.social?.linkedin || ''}
                onChange={(e) => updateSetting('social.linkedin', e.target.value)}
                placeholder="https://linkedin.com/company/yourcompany"
              />
              
              <Input
                label="Instagram"
                value={settings.social?.instagram || ''}
                onChange={(e) => updateSetting('social.instagram', e.target.value)}
                placeholder="https://instagram.com/yourhandle"
              />
            </div>
          </Card>

          {/* Analytics */}
          <Card>
            <h2 className="text-h3 mb-6">Analytics & Tracking</h2>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Google Analytics ID
              </label>
              <Input
                value={settings.analytics?.google_analytics_id || ''}
                onChange={(e) => updateSetting('analytics.google_analytics_id', e.target.value)}
                placeholder="G-XXXXXXXXXX"
              />
            </div>
          </Card>
        </div>
      </div>
    </Container>
  )
}

export default Settings


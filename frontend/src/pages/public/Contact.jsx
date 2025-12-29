import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react'
import Container from '../../components/common/Container'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { publicAPI } from '../../services/api'

const Contact = () => {
  const [pageData, setPageData] = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pageRes, settingsRes] = await Promise.all([
          publicAPI.getPage('contact'),
          publicAPI.getSettings(),
        ])
        setPageData(pageRes.data)
        setSettings(settingsRes.data)
      } catch (error) {
        console.error('Failed to fetch contact page data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <Container>
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        </div>
      </Container>
    )
  }

  const contact = settings?.contact || {}
  const content = pageData?.content || {}

  const handleWhatsApp = () => {
    const phone = contact.whatsapp?.replace(/[^0-9]/g, '') || ''
    if (phone) {
      window.open(`https://wa.me/${phone}`, '_blank')
    }
  }

  return (
    <div className="min-h-screen py-20 bg-neutral-50">
      <Container>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-display mb-4">
            {content.title || "Contact Us"}
          </h1>
          <p className="text-body-lg text-neutral-600 max-w-2xl mx-auto">
            {content.subtitle || "Get in touch with us for any shipping inquiries"}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <Card>
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-12 h-12 gradient-bg rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-h4 mb-2">Address</h3>
                  <p className="text-body-sm text-neutral-600">
                    {contact.address || "123 Main Street, City, State 12345"}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-12 h-12 gradient-bg rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-h4 mb-2">Phone</h3>
                  <a 
                    href={`tel:${contact.phone}`}
                    className="text-body-sm text-primary-600 hover:text-primary-700"
                  >
                    {contact.phone || "+91-1234567890"}
                  </a>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-12 h-12 gradient-bg rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-h4 mb-2">Email</h3>
                  <a 
                    href={`mailto:${contact.email}`}
                    className="text-body-sm text-primary-600 hover:text-primary-700"
                  >
                    {contact.email || "info@logismart.com"}
                  </a>
                </div>
              </div>
            </Card>

            {contact.whatsapp && (
              <Card>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                      <MessageCircle className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="text-h4 mb-1">WhatsApp</h3>
                      <p className="text-body-sm text-neutral-600">Chat with us</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleWhatsApp}
                  >
                    Message Us
                  </Button>
                </div>
              </Card>
            )}
          </motion.div>

          {/* Google Maps */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card padding="none" className="overflow-hidden">
              {contact.google_maps_embed ? (
                <div 
                  className="w-full h-full min-h-[400px]"
                  dangerouslySetInnerHTML={{ __html: contact.google_maps_embed }}
                />
              ) : (
                <div className="w-full h-[400px] bg-neutral-200 flex items-center justify-center">
                  <p className="text-neutral-500">Map will be displayed here</p>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </Container>
    </div>
  )
}

export default Contact

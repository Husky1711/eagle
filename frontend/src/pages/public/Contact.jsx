import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, MessageCircle, Send, CheckCircle, Loader2, Clock, Headphones } from 'lucide-react'
import Container from '../../components/common/Container'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { publicAPI } from '../../services/api'

const Contact = () => {
  const [pageData, setPageData] = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

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
  
  const getImageUrl = (filename) => {
    if (!filename) return null
    return `http://localhost:8000/uploads/${filename}`
  }
  
  const pageImage = content.image
  
  // Default location: Bangalore, India
  const defaultAddress = "Bangalore, Karnataka, India"
  const contactAddress = contact.address || defaultAddress

  const handleWhatsApp = () => {
    const phone = contact.whatsapp?.replace(/[^0-9]/g, '') || ''
    if (phone) {
      window.open(`https://wa.me/${phone}`, '_blank')
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required'
    } else if (!/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number'
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (!formData.message.trim()) {
      errors.message = 'Message is required'
    } else if (formData.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    setSubmitSuccess(false)
    setFormErrors({})
    
    try {
      // Submit contact form to backend
      await publicAPI.submitContactForm({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        honeypot: '' // Honeypot field (hidden from users)
      })
      
      setSubmitSuccess(true)
      setFormData({ name: '', phone: '', email: '', message: '' })
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false)
      }, 5000)
    } catch (error) {
      console.error('Failed to submit contact form:', error)
      
      // Handle different error types
      if (error.response?.status === 429) {
        setFormErrors({ submit: 'Too many submissions. Please try again later.' })
      } else if (error.response?.data?.detail) {
        // Validation errors from backend
        const detail = error.response.data.detail
        if (Array.isArray(detail)) {
          // Pydantic validation errors
          const errors = {}
          detail.forEach(err => {
            if (err.loc && err.loc.length > 1) {
              errors[err.loc[1]] = err.msg
            }
          })
          setFormErrors(errors)
        } else {
          setFormErrors({ submit: detail })
        }
      } else {
        setFormErrors({ submit: 'Failed to send message. Please try again later.' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section with Media */}
      <section 
        className="relative py-16 lg:py-20 overflow-hidden bg-gradient-to-br from-green-200 via-emerald-100 to-teal-200"
        style={pageImage ? {
          backgroundImage: `url(${getImageUrl(pageImage)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : {}}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-0 right-0 w-96 h-96 bg-green-300 rounded-full blur-3xl"
          ></motion.div>
          <motion.div
            animate={{
              x: [0, -100, 0],
              y: [0, -50, 0],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-0 left-0 w-96 h-96 bg-teal-300 rounded-full blur-3xl"
          ></motion.div>
        </div>
        
        <Container className="relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center justify-center w-16 h-16 gradient-bg rounded-full mb-6"
              >
                <Headphones className="text-white" size={32} />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-display mb-4 text-neutral-900"
              >
                {content.title || "Get In Touch"}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-body-lg text-neutral-700 mb-6"
              >
                {content.subtitle || "Have questions? We're here to help! Reach out to us through any of the channels below."}
              </motion.p>
            </motion.div>

            {/* Right: Animated Illustration */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                {/* Main Image */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="aspect-square rounded-2xl overflow-hidden shadow-2xl"
                  style={{
                    backgroundImage: 'url(https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&h=600&fit=crop)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-teal-500/20"></div>
                </motion.div>
                
                {/* Floating Animated Icons */}
                <motion.div
                  animate={{
                    y: [0, -20, 0],
                    rotate: [0, 10, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute -top-6 -right-6 bg-white p-4 rounded-full shadow-xl"
                >
                  <MessageCircle className="text-green-500" size={28} />
                </motion.div>
                <motion.div
                  animate={{
                    y: [0, 20, 0],
                    rotate: [0, -10, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                  className="absolute -bottom-6 -left-6 bg-white p-4 rounded-full shadow-xl"
                >
                  <Phone className="text-teal-500" size={28} />
                </motion.div>
                <motion.div
                  animate={{
                    scale: [1, 1.15, 1],
                    rotate: [0, 15, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                  className="absolute top-1/2 -right-8 bg-white p-4 rounded-full shadow-xl"
                >
                  <Mail className="text-emerald-500" size={28} />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Main Contact Section */}
      <section className="py-16 lg:py-20 bg-white">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 gradient-bg rounded-lg flex items-center justify-center">
                    <Send className="text-white" size={24} />
                  </div>
                  <h2 className="text-h3">Send Us a Message</h2>
                </div>

                {submitSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 bg-success-50 border border-success-200 text-success-600 px-4 py-3 rounded-lg flex items-center gap-2"
                  >
                    <CheckCircle size={20} />
                    <span>Thank you! Your message has been sent successfully. We'll get back to you soon.</span>
                  </motion.div>
                )}

                {formErrors.submit && (
                  <div className="mb-6 bg-error-50 border border-error-200 text-error-600 px-4 py-3 rounded-lg">
                    {formErrors.submit}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <Input
                    label="Full Name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    error={formErrors.name}
                    required
                  />

                  <Input
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+91-1234567890"
                    error={formErrors.phone}
                    required
                  />

                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com"
                    error={formErrors.email}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Message / Query Description
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows="5"
                      placeholder="Describe your query or issue in detail..."
                      className={`
                        w-full px-4 py-3 border rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                        transition-all duration-200
                        ${formErrors.message ? 'border-error-500 focus:ring-error-500' : 'border-neutral-300'}
                      `}
                      required
                    />
                    {formErrors.message && (
                      <p className="mt-1 text-sm text-error-500">{formErrors.message}</p>
                    )}
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="inline-block mr-2 animate-spin" size={20} />
                          Sending...
                        </>
                      ) : (
                        <>
                          Send Message
                          <Send className="inline-block ml-2" size={20} />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </Card>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              {/* Contact Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                whileHover={{ y: -4 }}
              >
                <Card>
                  <div className="flex items-start gap-4">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-14 h-14 gradient-bg rounded-lg flex items-center justify-center flex-shrink-0"
                    >
                      <MapPin className="text-white" size={24} />
                    </motion.div>
                     <div className="flex-1">
                       <h3 className="text-h4 mb-2">Our Address</h3>
                       <p className="text-body-sm text-neutral-600">
                         {contactAddress}
                       </p>
                     </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Card>
                  <div className="flex items-start gap-4">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-14 h-14 gradient-bg rounded-lg flex items-center justify-center flex-shrink-0"
                    >
                      <Phone className="text-white" size={24} />
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="text-h4 mb-2">Phone Number</h3>
                      <a 
                        href={`tel:${contact.phone || '+91-1234567890'}`}
                        className="text-body-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                      >
                        {contact.phone || "+91-1234567890"}
                      </a>
                      <p className="text-xs text-neutral-500 mt-1">Mon - Sat, 9:00 AM - 6:00 PM</p>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                whileHover={{ y: -4 }}
              >
                <Card>
                  <div className="flex items-start gap-4">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-14 h-14 gradient-bg rounded-lg flex items-center justify-center flex-shrink-0"
                    >
                      <Mail className="text-white" size={24} />
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="text-h4 mb-2">Email Address</h3>
                      <a 
                        href={`mailto:${contact.email || 'info@logismart.com'}`}
                        className="text-body-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                      >
                        {contact.email || "info@logismart.com"}
                      </a>
                      <p className="text-xs text-neutral-500 mt-1">We'll respond within 24 hours</p>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {contact.whatsapp && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <motion.div
                          whileHover={{ scale: 1.15, rotate: [0, -10, 10, 0] }}
                          transition={{ duration: 0.3 }}
                          className="w-14 h-14 bg-green-500 rounded-lg flex items-center justify-center"
                        >
                          <MessageCircle className="text-white" size={24} />
                        </motion.div>
                        <div>
                          <h3 className="text-h4 mb-1">WhatsApp</h3>
                          <p className="text-body-sm text-neutral-600">Chat with us instantly</p>
                        </div>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="outline"
                          onClick={handleWhatsApp}
                          className="border-green-500 text-green-600 hover:bg-green-50"
                        >
                          Message Us
                        </Button>
                      </motion.div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Business Hours */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card className="bg-gradient-to-br from-primary-50 to-secondary-50">
                  <div className="flex items-start gap-4">
                    <motion.div
                      animate={{
                        rotate: [0, 360],
                      }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      className="w-14 h-14 gradient-bg rounded-lg flex items-center justify-center flex-shrink-0"
                    >
                      <Clock className="text-white" size={24} />
                    </motion.div>
                    <div>
                      <h3 className="text-h4 mb-3">Business Hours</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Monday - Friday</span>
                          <span className="font-medium">9:00 AM - 6:00 PM</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Saturday</span>
                          <span className="font-medium">10:00 AM - 4:00 PM</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Sunday</span>
                          <span className="font-medium text-neutral-400">Closed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Google Maps Section */}
      <section className="py-16 lg:py-20 bg-neutral-200">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-5xl mx-auto"
          >
            <div className="text-center mb-8">
              <h2 className="text-h2 mb-3">Find Us on Map</h2>
              <p className="text-body text-neutral-600">Visit our office or get directions</p>
            </div>
            <Card padding="none" className="overflow-hidden shadow-xl">
              {contact.google_maps_embed ? (
                // If custom embed code (iframe HTML) is provided, use it directly
                <div 
                  className="w-full h-full min-h-[450px]"
                  dangerouslySetInnerHTML={{ __html: contact.google_maps_embed }}
                />
              ) : contact.google_maps_url ? (
                // If Google Maps embed URL is provided, use it
                <iframe
                  src={contact.google_maps_url}
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full"
                  title="Office Location"
                />
               ) : (
                 // Generate embed from address (defaults to Bangalore, India if no address configured)
                 <iframe
                   src={`https://www.google.com/maps?q=${encodeURIComponent(contactAddress)}&output=embed`}
                   width="100%"
                   height="450"
                   style={{ border: 0 }}
                   allowFullScreen
                   loading="lazy"
                   referrerPolicy="no-referrer-when-downgrade"
                   className="w-full"
                   title="Office Location"
                 />
               )}
            </Card>
          </motion.div>
        </Container>
      </section>
    </div>
  )
}

export default Contact

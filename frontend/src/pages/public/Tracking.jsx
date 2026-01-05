import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Package, MapPin, Clock, CheckCircle } from 'lucide-react'
import Container from '../../components/common/Container'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import { publicAPI } from '../../services/api'

const Tracking = () => {
  const [pageData, setPageData] = useState(null)
  const [couriers, setCouriers] = useState([])
  const [selectedCourier, setSelectedCourier] = useState('')
  const [trackingId, setTrackingId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pageRes, couriersRes] = await Promise.all([
          publicAPI.getPage('tracking'),
          publicAPI.getCouriers(),
        ])
        setPageData(pageRes.data)
        setCouriers(couriersRes.data || [])
        if (couriersRes.data && couriersRes.data.length > 0) {
          setSelectedCourier(couriersRes.data[0].id)
        }
      } catch (error) {
        console.error('Failed to fetch tracking page data:', error)
      }
    }
    fetchData()
  }, [])

  const handleTrack = async (e) => {
    e.preventDefault()
    setError('')

    if (!selectedCourier) {
      setError('Please select a courier')
      return
    }

    if (!trackingId.trim()) {
      setError('Please enter a tracking number')
      return
    }

    setLoading(true)
    try {
      const response = await publicAPI.getTrackingUrl(selectedCourier, trackingId.trim())
      // Redirect to courier tracking page
      window.location.href = response.data.redirect_url
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to get tracking URL. Please try again.')
      setLoading(false)
    }
  }

  const content = pageData?.content || {}

  const getImageUrl = (filename) => {
    if (!filename) return null
    return `http://localhost:8000/uploads/${filename}`
  }

  const pageImage = content.image

  return (
    <div className="min-h-screen">
      {/* Hero Section with Background Image */}
      <section
        className="relative py-20 lg:py-24 overflow-hidden bg-gradient-to-br from-indigo-200 via-purple-100 to-pink-200"
        style={pageImage ? {
          backgroundImage: `url(${getImageUrl(pageImage)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : {}}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-300 rounded-full blur-3xl"></div>
        </div>

        <Container className="relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 gradient-bg rounded-full mb-6">
                <Package className="text-white" size={32} />
              </div>
              <h1 className="text-display mb-4 text-neutral-900">
                {content.title || "Track Your Parcel"}
              </h1>
              <p className="text-body-lg text-neutral-700 max-w-xl">
                {content.subtitle || "Select your courier and enter tracking number to track your shipment in real-time"}
              </p>
            </motion.div>

            {/* Right: Illustration Image */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative">
                {/* Background Image */}
                <div
                  className="aspect-square rounded-2xl overflow-hidden shadow-2xl"
                  style={{
                    backgroundImage: 'url(https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=800&fit=crop)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20"></div>
                </div>
                {/* Floating Icons */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -top-4 -right-4 bg-white p-4 rounded-full shadow-lg"
                >
                  <Search className="text-indigo-500" size={32} />
                </motion.div>
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                  className="absolute -bottom-4 -left-4 bg-white p-4 rounded-full shadow-lg"
                >
                  <MapPin className="text-purple-500" size={32} />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Tracking Form Section */}
      <section className="py-20 bg-white">
        <Container>
          <div className="max-w-2xl mx-auto">

            {/* Tracking Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card>
                <form onSubmit={handleTrack} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      {content.courierLabel || "Select Courier"}
                    </label>
                    <select
                      value={selectedCourier}
                      onChange={(e) => setSelectedCourier(e.target.value)}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      required
                    >
                      <option value="">Choose a courier...</option>
                      {couriers.map((courier) => (
                        <option key={courier.id} value={courier.id}>
                          {courier.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label={content.trackingLabel || "Tracking Number"}
                    type="text"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    placeholder="Enter your tracking number"
                    required
                  />

                  {error && (
                    <div className="bg-error-50 border border-error-200 text-error-600 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Search className="inline-block mr-2 animate-pulse" size={20} />
                        Redirecting...
                      </>
                    ) : (
                      <>
                        {content.trackButton || "Track Parcel"}
                        <Search className="inline-block ml-2" size={20} />
                      </>
                    )}
                  </Button>
                </form>
              </Card>

              {/* Info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-8 text-center"
              >
                <p className="text-sm text-neutral-600">
                  You will be redirected to the official courier tracking website
                </p>
              </motion.div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-neutral-200">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-h2 mb-4">Track with Confidence</h2>
            <p className="text-body text-neutral-600 max-w-2xl mx-auto">
              Real-time tracking across all major courier services
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Search, title: "Quick Search", desc: "Find your parcel instantly" },
              { icon: Clock, title: "Real-time Updates", desc: "Get live tracking information" },
              { icon: CheckCircle, title: "Verified Status", desc: "Accurate delivery updates" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="text-center h-full">
                  <div className="w-16 h-16 gradient-bg rounded-full flex items-center justify-center mx-auto mb-4">
                    <item.icon className="text-white" size={32} />
                  </div>
                  <h3 className="text-h4 mb-2">{item.title}</h3>
                  <p className="text-body-sm text-neutral-600">{item.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>
    </div>
  )
}

export default Tracking

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Package } from 'lucide-react'
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

  return (
    <div className="min-h-screen py-20 bg-neutral-50">
      <Container>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 gradient-bg rounded-full mb-6">
              <Package className="text-white" size={32} />
            </div>
            <h1 className="text-display mb-4">
              {content.title || "Track Your Parcel"}
            </h1>
            <p className="text-body-lg text-neutral-600">
              {content.subtitle || "Select your courier and enter tracking number"}
            </p>
          </motion.div>

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
    </div>
  )
}

export default Tracking

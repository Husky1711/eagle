import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calculator, CheckCircle, Loader2, Package, MapPin, DollarSign, Clock, Globe } from 'lucide-react'
import Container from '../../components/common/Container'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import { publicAPI } from '../../services/api'

const Pricing = () => {
  const [pageData, setPageData] = useState(null)
  const [weight, setWeight] = useState('')
  const [destinations, setDestinations] = useState([])
  const [selectedDestination, setSelectedDestination] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pageRes, destRes] = await Promise.all([
          publicAPI.getPage('pricing'),
          publicAPI.getDestinations()
        ])
        setPageData(pageRes.data)
        setDestinations(destRes.data || [])
      } catch (error) {
        console.error('Failed to fetch pricing data:', error)
      }
    }
    fetchData()
  }, [])

  const handleCalculate = async (e) => {
    e.preventDefault()
    setError('')
    setResults(null)

    const weightNum = parseFloat(weight)

    if (!weightNum || weightNum <= 0) {
      setError('Please enter a valid weight (greater than 0)')
      return
    }

    if (!selectedDestination) {
      setError('Please select a destination')
      return
    }

    setLoading(true)
    try {
      const response = await publicAPI.calculatePricing({
        weight: weightNum,
        destination: selectedDestination,
      })
      setResults(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to calculate pricing. Please try again.')
    } finally {
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
      {/* Hero Section with Media - Matching Other Pages */}
      <section
        className="relative py-16 lg:py-20 overflow-hidden bg-gradient-to-br from-blue-200 via-blue-100 to-indigo-200"
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
            className="absolute top-0 right-0 w-96 h-96 bg-primary-300 rounded-full blur-3xl"
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
            className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-300 rounded-full blur-3xl"
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
                <Calculator className="text-white" size={32} />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-display mb-4 text-neutral-900"
              >
                {content.title || "Get Your Shipping Quote"}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-body-lg text-neutral-700 max-w-xl"
              >
                {content.subtitle || "Select your destination and package weight to instantly compare exact rates from our premium courier partners."}
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
                  className="aspect-square rounded-2xl overflow-hidden shadow-xl"
                  style={{
                    backgroundImage: 'url(https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&h=600&fit=crop)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-secondary-500/20"></div>
                </motion.div>

                {/* Floating Animated Icons */}
                <motion.div
                  animate={{
                    y: [0, -15, 0],
                    rotate: [0, 5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute -top-4 -right-4 bg-white p-3 rounded-full shadow-lg"
                >
                  <Globe className="text-primary-500" size={24} />
                </motion.div>
                <motion.div
                  animate={{
                    y: [0, 15, 0],
                    rotate: [0, -5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                  className="absolute -bottom-4 -left-4 bg-white p-3 rounded-full shadow-lg"
                >
                  <DollarSign className="text-secondary-500" size={24} />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Main Calculator Section - Improved Layout */}
      <section className="py-16 lg:py-20 bg-white">
        <Container>
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Input Form */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="sticky top-6">
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                      className="flex items-center gap-4 mb-8"
                    >
                      <motion.div
                        whileHover={{ scale: 1.15, rotate: 5 }}
                        className="w-14 h-14 gradient-bg rounded-lg flex items-center justify-center"
                      >
                        <Package className="text-white" size={28} />
                      </motion.div>
                      <h2 className="text-h3 font-semibold">Quote Calculator</h2>
                    </motion.div>
                    <form onSubmit={handleCalculate} className="space-y-6">
                      <Input
                        label={content.weightLabel || "Package Weight (kg)"}
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="e.g., 2.5"
                        required
                      />

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-neutral-700">
                          {content.destinationLabel || "Destination"}
                        </label>
                        <div className="relative">
                          <Globe className="absolute left-4 top-3 text-neutral-400" size={20} />
                          <select
                            value={selectedDestination}
                            onChange={(e) => setSelectedDestination(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-shadow appearance-none"
                            required
                          >
                            <option value="">Select Country / Zone</option>
                            {destinations.map((dest, idx) => (
                              <option key={idx} value={dest}>
                                {dest}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-3.5 pointer-events-none">
                            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M1 1.5L6 6.5L11 1.5" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {error && (
                        <div className="bg-error-50 border border-error-200 text-error-600 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                          <span className="text-xl">!</span> {error}
                        </div>
                      )}

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          type="submit"
                          variant="primary"
                          size="lg"
                          disabled={loading}
                          className="w-full"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="inline-block mr-2 animate-spin" size={20} />
                              Getting Quotes...
                            </>
                          ) : (
                            <>
                              {content.calculateButton || "View Shipping Rates"}
                              <Calculator className="inline-block ml-2" size={20} />
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </form>
                  </Card>
                </motion.div>
              </motion.div>

              {/* Results */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                {results && results.length > 0 ? (
                  <div>
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                      className="flex items-center justify-between mb-8"
                    >
                      <h2 className="text-h2">Best Options</h2>
                      <motion.span
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="text-body text-neutral-600 bg-primary-50 px-4 py-2 rounded-full"
                      >
                        {results.length} options found
                      </motion.span>
                    </motion.div>
                    <div className="space-y-4">
                      {results.slice(0, 3).map((result, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.95, y: 20 }}
                          whileInView={{ opacity: 1, scale: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 0.5,
                            delay: index * 0.1,
                            type: "spring",
                            stiffness: 100
                          }}
                          whileHover={{
                            y: -6,
                            transition: { duration: 0.2 }
                          }}
                        >
                          <Card className={`relative transition-all ${index === 0 ? 'border-2 border-primary-500 shadow-xl bg-gradient-to-br from-primary-50/50 to-white' : 'hover:shadow-lg border border-neutral-200'}`}>
                            {index === 0 && (
                              <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 200,
                                  delay: 0.5
                                }}
                                className="absolute -top-2 left-4 bg-primary-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold"
                              >
                                Best Price
                              </motion.div>
                            )}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <motion.h3
                                  initial={{ opacity: 0 }}
                                  whileInView={{ opacity: 1 }}
                                  viewport={{ once: true }}
                                  transition={{ delay: index * 0.1 + 0.2 }}
                                  className="text-h4 font-bold text-neutral-900 mb-2"
                                >
                                  {result.courier_name}
                                </motion.h3>

                                <div className="space-y-1">
                                  {result.estimated_delivery && (
                                    <motion.p
                                      initial={{ opacity: 0, x: -10 }}
                                      whileInView={{ opacity: 1, x: 0 }}
                                      viewport={{ once: true }}
                                      transition={{ delay: index * 0.1 + 0.3 }}
                                      className="text-body-sm text-neutral-600 flex items-center gap-2"
                                    >
                                      <Clock size={14} className="text-primary-500" />
                                      {result.estimated_delivery}
                                    </motion.p>
                                  )}
                                  <p className="text-body-sm text-neutral-600 flex items-center gap-2">
                                    <Globe size={14} className="text-secondary-500" />
                                    Zone: <span className="font-semibold text-neutral-800">{result.breakdown.zone}</span>
                                  </p>
                                </div>
                              </div>
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{
                                  delay: index * 0.1 + 0.4,
                                  type: "spring",
                                  stiffness: 150
                                }}
                                className="text-right"
                              >
                                <div className="text-4xl font-extrabold gradient-text mb-1">
                                  ₹{result.price.toFixed(2)}
                                </div>
                                <p className="text-body-sm text-neutral-500">Total shipping cost</p>
                              </motion.div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : results && results.length === 0 ? (
                  <Card>
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="text-neutral-300" size={32} />
                      </div>
                      <h3 className="text-lg font-semibold text-neutral-900 mb-2">No quotes available</h3>
                      <p className="text-neutral-600 text-sm max-w-xs mx-auto">
                        We couldn't find any shipping options for {selectedDestination} with weight {weight}kg.
                      </p>
                      <button
                        onClick={() => {
                          setWeight('')
                          setSelectedDestination('')
                          setResults(null)
                        }}
                        className="mt-6 text-primary-600 font-medium hover:underline"
                      >
                        Try different parameters
                      </button>
                    </div>
                  </Card>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card className="bg-gradient-to-br from-neutral-50 to-neutral-100 h-full flex items-center justify-center min-h-[400px]">
                      <div className="text-center p-8">
                        <motion.div
                          animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="w-20 h-20 gradient-bg rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-500/20"
                        >
                          <Calculator className="text-white" size={40} />
                        </motion.div>
                        <h3 className="text-xl font-bold text-neutral-900 mb-2">Ready to ship?</h3>
                        <p className="text-neutral-600 mb-1">Enter your package details to get</p>
                        <p className="text-neutral-600 font-medium">instant quotes from top couriers</p>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
        </Container>
      </section>

      {/* Benefits Section - Matching Other Pages */}
      <section className="py-16 lg:py-20 bg-neutral-200">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-h2 mb-4">Why Use Our Calculator?</h2>
            <p className="text-body text-neutral-600 max-w-2xl mx-auto">
              Get instant quotes from multiple courier partners
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { icon: Calculator, title: "Compare Prices", desc: "See all options side by side" },
              { icon: Package, title: "Best Rates", desc: "We find the lowest shipping costs" },
              { icon: MapPin, title: "Fast Delivery", desc: "Choose the quickest option" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{
                  y: -8,
                  transition: { duration: 0.2 }
                }}
              >
                <Card className="text-center h-full">
                  <motion.div
                    whileHover={{
                      scale: 1.15,
                      rotate: [0, -10, 10, 0],
                    }}
                    transition={{ duration: 0.3 }}
                    className="w-16 h-16 gradient-bg rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <item.icon className="text-white" size={32} />
                  </motion.div>
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

export default Pricing

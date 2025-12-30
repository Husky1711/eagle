import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calculator, CheckCircle, Loader2, Package, MapPin, DollarSign, Clock } from 'lucide-react'
import Container from '../../components/common/Container'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import { publicAPI } from '../../services/api'

const Pricing = () => {
  const [pageData, setPageData] = useState(null)
  const [weight, setWeight] = useState('')
  const [distance, setDistance] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        const response = await publicAPI.getPage('pricing')
        setPageData(response.data)
      } catch (error) {
        console.error('Failed to fetch pricing page data:', error)
      }
    }
    fetchPageData()
  }, [])

  const handleCalculate = async (e) => {
    e.preventDefault()
    setError('')
    setResults(null)

    const weightNum = parseFloat(weight)
    const distanceNum = parseFloat(distance)

    if (!weightNum || weightNum <= 0) {
      setError('Please enter a valid weight (greater than 0)')
      return
    }

    if (!distanceNum || distanceNum <= 0) {
      setError('Please enter a valid distance (greater than 0)')
      return
    }

    setLoading(true)
    try {
      const response = await publicAPI.calculatePricing({
        weight: weightNum,
        distance: distanceNum,
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
                {content.title || "Calculate Your Shipping Cost"}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-body-lg text-neutral-700 max-w-xl"
              >
                {content.subtitle || "Enter your parcel details to get the best rates from multiple courier partners"}
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
                    backgroundImage: 'url(https://images.unsplash.com/photo-1607082349566-187342175e2f?w=600&h=600&fit=crop)',
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
                  <Package className="text-primary-500" size={24} />
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
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 10, 0],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                  className="absolute top-1/2 -right-8 bg-white p-3 rounded-full shadow-lg"
                >
                  <MapPin className="text-indigo-500" size={24} />
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
              {/* Input Form - Improved Design */}
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
                      <h2 className="text-h3 font-semibold">Parcel Details</h2>
                    </motion.div>
                  <form onSubmit={handleCalculate} className="space-y-6">
                    <Input
                      label={content.weightLabel || "Weight (kg)"}
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="e.g., 2.5"
                      required
                    />

                    <Input
                      label={content.distanceLabel || "Distance (km)"}
                      type="number"
                      step="1"
                      min="1"
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                      placeholder="e.g., 200"
                      required
                    />

                    {error && (
                      <div className="bg-error-50 border border-error-200 text-error-600 px-3 py-2 rounded-lg text-sm">
                        {error}
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
                            Calculating...
                          </>
                        ) : (
                          <>
                            {content.calculateButton || "Calculate Price"}
                            <Calculator className="inline-block ml-2" size={20} />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </form>
                  </Card>
                </motion.div>
              </motion.div>

              {/* Results - Improved Grid Layout */}
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
                          key={result.courier}
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
                                {result.estimated_delivery && (
                                  <motion.p
                                    initial={{ opacity: 0, x: -10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 + 0.3 }}
                                    className="text-body-sm text-neutral-600 flex items-center gap-2"
                                  >
                                    <motion.span
                                      animate={{ rotate: [0, 360] }}
                                      transition={{ 
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "linear"
                                      }}
                                    >
                                      <Clock size={16} className="text-primary-500" />
                                    </motion.span>
                                    {result.estimated_delivery}
                                  </motion.p>
                                )}
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

                            {/* Improved Breakdown */}
                            <div className="pt-4 border-t border-neutral-200 space-y-2">
                              <div className="flex justify-between text-body-sm">
                                <span className="text-neutral-600">Base Price:</span>
                                <span className="font-semibold text-neutral-900">₹{result.breakdown.base_price}</span>
                              </div>
                              <div className="flex justify-between text-body-sm">
                                <span className="text-neutral-600">Weight ({result.breakdown.weight}kg):</span>
                                <span className="font-semibold text-neutral-900">₹{result.breakdown.weight_cost.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-body-sm">
                                <span className="text-neutral-600">Distance Zone:</span>
                                <span className="font-semibold text-neutral-900 capitalize">{result.breakdown.zone}</span>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : results && results.length === 0 ? (
                  <Card>
                    <div className="text-center py-8">
                      <Package className="mx-auto text-neutral-300 mb-3" size={40} />
                      <p className="text-neutral-600 text-sm">No pricing options available</p>
                      <p className="text-xs text-neutral-500 mt-1">Try different weight or distance values</p>
                    </div>
                  </Card>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card className="bg-gradient-to-br from-neutral-50 to-neutral-100">
                      <div className="text-center py-10">
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
                          className="w-16 h-16 gradient-bg rounded-full flex items-center justify-center mx-auto mb-4"
                        >
                          <Calculator className="text-white" size={32} />
                        </motion.div>
                        <p className="text-neutral-600 font-medium">Enter parcel details to see pricing</p>
                        <p className="text-xs text-neutral-500 mt-1">Get instant quotes from multiple couriers</p>
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

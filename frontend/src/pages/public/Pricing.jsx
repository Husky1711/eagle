import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calculator, CheckCircle, Loader2 } from 'lucide-react'
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

  return (
    <div className="min-h-screen py-20">
      <Container>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 gradient-bg rounded-full mb-6">
            <Calculator className="text-white" size={32} />
          </div>
          <h1 className="text-display mb-4">
            {content.title || "Calculate Your Shipping Cost"}
          </h1>
          <p className="text-body-lg text-neutral-600 max-w-2xl mx-auto">
            {content.subtitle || "Enter your parcel details to get the best rates from multiple courier partners"}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Input Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card>
              <h2 className="text-h3 mb-6">Parcel Details</h2>
              <form onSubmit={handleCalculate} className="space-y-6">
                <Input
                  label={content.weightLabel || "Parcel Weight (kg)"}
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g., 2.5"
                  required
                />

                <Input
                  label={content.distanceLabel || "Delivery Distance (km)"}
                  type="number"
                  step="1"
                  min="1"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder="e.g., 200"
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
                      <Loader2 className="inline-block mr-2 animate-spin" size={20} />
                      Calculating...
                    </>
                  ) : (
                    content.calculateButton || "Calculate Price"
                  )}
                </Button>
              </form>
            </Card>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {results && results.length > 0 ? (
              <div className="space-y-4">
                <h2 className="text-h3 mb-6">Best Options</h2>
                {results.map((result, index) => (
                  <motion.div
                    key={result.courier}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <Card className={index === 0 ? 'border-2 border-primary-500 relative' : ''}>
                      {index === 0 && (
                        <div className="absolute -top-3 left-6 bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                          Best Price
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-h4 mb-1">{result.courier_name}</h3>
                          {result.estimated_delivery && (
                            <p className="text-sm text-neutral-600">
                              Estimated: {result.estimated_delivery}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold gradient-text">
                            ₹{result.price.toFixed(2)}
                          </div>
                          <p className="text-sm text-neutral-600">Total Cost</p>
                        </div>
                      </div>

                      {/* Breakdown */}
                      <div className="pt-4 border-t border-neutral-200 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">Base Price:</span>
                          <span className="font-medium">₹{result.breakdown.base_price}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">
                            Weight Cost ({result.breakdown.weight}kg × ₹{result.breakdown.price_per_kg}/kg):
                          </span>
                          <span className="font-medium">₹{result.breakdown.weight_cost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">Distance Zone:</span>
                          <span className="font-medium capitalize">{result.breakdown.zone}</span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : results && results.length === 0 ? (
              <Card>
                <div className="text-center py-8">
                  <p className="text-neutral-600">No pricing options available for this combination.</p>
                  <p className="text-sm text-neutral-500 mt-2">Please try different weight or distance values.</p>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="text-center py-12">
                  <Calculator className="mx-auto text-neutral-300 mb-4" size={48} />
                  <p className="text-neutral-600">Enter parcel details to see pricing options</p>
                </div>
              </Card>
            )}
          </motion.div>
        </div>
      </Container>
    </div>
  )
}

export default Pricing

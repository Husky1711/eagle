import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Package, Search, Truck } from 'lucide-react'
import Container from '../../components/common/Container'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import { publicAPI } from '../../services/api'

const Home = () => {
  const [pageData, setPageData] = useState(null)
  const [sections, setSections] = useState(null)
  const [couriers, setCouriers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pageRes, couriersRes] = await Promise.all([
          publicAPI.getPage('home'),
          publicAPI.getCouriers(),
        ])

        setPageData(pageRes.data)
        setCouriers(couriersRes.data || [])
        
        // Fetch sections - we'll use default structure for now
        // Sections can be added to pages.json or fetched separately later
        setSections({
          home: {
            how_it_works: {
              enabled: true,
              title: "How It Works",
              steps: [
                { id: 1, title: "Drop Your Parcel", description: "Bring your parcel to our logistics center", icon: "" },
                { id: 2, title: "We Choose Best Courier", description: "We compare multiple courier partners and select the best option for you", icon: "" },
                { id: 3, title: "Fast & Safe Delivery", description: "Your parcel is delivered safely and on time", icon: "" },
              ]
            },
            why_choose_us: {
              enabled: true,
              title: "Why Choose Us",
              features: [
                { id: 1, title: "Best Prices", description: "We compare multiple vendors to get you the best rates", icon: "" },
                { id: 2, title: "Fast Delivery", description: "Quick and reliable delivery options", icon: "" },
                { id: 3, title: "Easy Tracking", description: "Track your parcels across multiple courier services", icon: "" },
              ]
            }
          }
        })
        
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch home page data:', error)
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

  const hero = pageData?.content?.hero || {}
  const howItWorks = sections?.home?.how_it_works || {
    enabled: true,
    title: "How It Works",
    steps: [
      { id: 1, title: "Drop Your Parcel", description: "Bring your parcel to our logistics center", icon: "" },
      { id: 2, title: "We Choose Best Courier", description: "We compare multiple courier partners and select the best option for you", icon: "" },
      { id: 3, title: "Fast & Safe Delivery", description: "Your parcel is delivered safely and on time", icon: "" },
    ]
  }
  const whyChooseUs = sections?.home?.why_choose_us || {
    enabled: true,
    title: "Why Choose Us",
    features: [
      { id: 1, title: "Best Prices", description: "We compare multiple vendors to get you the best rates", icon: "" },
      { id: 2, title: "Fast Delivery", description: "Quick and reliable delivery options", icon: "" },
      { id: 3, title: "Easy Tracking", description: "Track your parcels across multiple courier services", icon: "" },
    ]
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 gradient-bg opacity-5"></div>
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-display mb-6 text-neutral-900">
                {hero.headline || "Smart Logistics. Best Price. Fast Delivery."}
              </h1>
              <p className="text-body-lg text-neutral-600 mb-8">
                {hero.subheadline || "We compare multiple courier partners to find you the best shipping rates and fastest delivery options."}
              </p>
              <Link to="/pricing">
                <Button size="lg" className="group">
                  {hero.cta || "Calculate Shipping Cost"}
                  <ArrowRight className="inline-block ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                </Button>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-square bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl flex items-center justify-center">
                <Truck size={200} className="text-primary-500 opacity-20" />
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* How It Works Section */}
      {howItWorks.enabled && (
        <section className="py-20 bg-neutral-50">
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-h2 mb-4">{howItWorks.title}</h2>
              <p className="text-body text-neutral-600 max-w-2xl mx-auto">
                Simple steps to get your parcel delivered at the best price
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {howItWorks.steps?.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="text-center h-full">
                    <div className="w-16 h-16 gradient-bg rounded-full flex items-center justify-center mx-auto mb-6">
                      {index === 0 && <Package className="text-white" size={32} />}
                      {index === 1 && <Search className="text-white" size={32} />}
                      {index === 2 && <Truck className="text-white" size={32} />}
                    </div>
                    <h3 className="text-h4 mb-3">{step.title}</h3>
                    <p className="text-body-sm text-neutral-600">{step.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Courier Partners Section */}
      {couriers.length > 0 && (
        <section className="py-20">
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-h2 mb-4">Our Courier Partners</h2>
              <p className="text-body text-neutral-600 max-w-2xl mx-auto">
                We work with trusted courier services to ensure reliable delivery
              </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {couriers.map((courier, index) => (
                <motion.div
                  key={courier.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center justify-center"
                >
                  <Card hover={false} padding="lg" className="w-full text-center grayscale hover:grayscale-0 transition-all duration-300">
                    {courier.logo ? (
                      <img src={`/uploads/${courier.logo}`} alt={courier.name} className="h-12 mx-auto object-contain" />
                    ) : (
                      <span className="text-lg font-semibold text-neutral-700">{courier.name}</span>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Why Choose Us Section */}
      {whyChooseUs.enabled && (
        <section className="py-20 bg-neutral-50">
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-h2 mb-4">{whyChooseUs.title}</h2>
              <p className="text-body text-neutral-600 max-w-2xl mx-auto">
                Why thousands of customers trust us for their shipping needs
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {whyChooseUs.features?.map((feature, index) => (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <h3 className="text-h4 mb-3">{feature.title}</h3>
                    <p className="text-body-sm text-neutral-600">{feature.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 gradient-bg">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center text-white"
          >
            <h2 className="text-h2 mb-4">Ready to Ship?</h2>
            <p className="text-body-lg mb-8 opacity-90">
              Calculate your shipping cost now and get the best rates
            </p>
            <Link to="/pricing">
              <Button variant="secondary" size="lg">
                Get Started
                <ArrowRight className="inline-block ml-2" size={20} />
              </Button>
            </Link>
          </motion.div>
        </Container>
      </section>
    </div>
  )
}

export default Home

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Target, Users, Zap, Shield, TrendingUp, Award, CheckCircle, ArrowRight } from 'lucide-react'
import Container from '../../components/common/Container'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { Link } from 'react-router-dom'
import { publicAPI } from '../../services/api'

const About = () => {
  const [pageData, setPageData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        const response = await publicAPI.getPage('about')
        setPageData(response.data)
      } catch (error) {
        console.error('Failed to fetch about page data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPageData()
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

  const content = pageData?.content || {}
  const sections = content.sections || []
  
  const getImageUrl = (filename) => {
    if (!filename) return null
    return `http://localhost:8000/uploads/${filename}`
  }

  // Default content for logistics aggregator
  const aboutContent = {
    whoWeAre: content.whoWeAre || "LogiSmart is a leading logistics aggregation platform that revolutionizes how businesses and individuals ship their parcels. We act as a smart mediation center, comparing multiple courier vendors to find you the best shipping rates, fastest delivery options, and most reliable services.",
    mission: content.mission || "Our mission is to simplify logistics by providing transparent, competitive pricing and seamless shipping experiences. We empower customers with choice, ensuring they get the best value for their shipping needs while maintaining the highest standards of service and reliability.",
    vision: content.vision || "To become the most trusted logistics aggregation platform, connecting customers with the best courier services while driving innovation in the shipping industry.",
    values: [
      { icon: Target, title: "Transparency", desc: "Clear pricing and honest comparisons" },
      { icon: Zap, title: "Efficiency", desc: "Fast, streamlined shipping processes" },
      { icon: Shield, title: "Reliability", desc: "Trusted partnerships with top couriers" },
      { icon: TrendingUp, title: "Innovation", desc: "Constantly improving our platform" },
    ],
    stats: [
      { number: "10K+", label: "Happy Customers" },
      { number: "50+", label: "Courier Partners" },
      { number: "1M+", label: "Parcels Delivered" },
      { number: "99%", label: "Satisfaction Rate" },
    ],
    whyChooseUs: [
      { icon: CheckCircle, title: "Best Price Guarantee", desc: "We compare prices from multiple courier partners to ensure you get the best rates available in the market." },
      { icon: CheckCircle, title: "Wide Network", desc: "Access to 50+ trusted courier partners covering all major routes and destinations." },
      { icon: CheckCircle, title: "Easy Tracking", desc: "Track all your shipments from a single platform, regardless of the courier service." },
      { icon: CheckCircle, title: "24/7 Support", desc: "Round-the-clock customer support to assist you with any shipping queries or issues." },
    ]
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section with Media */}
      <section className="relative py-16 lg:py-20 overflow-hidden bg-gradient-to-br from-indigo-200 via-purple-100 to-pink-200">
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
            className="absolute top-0 right-0 w-96 h-96 bg-indigo-300 rounded-full blur-3xl"
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
            className="absolute bottom-0 left-0 w-96 h-96 bg-pink-300 rounded-full blur-3xl"
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
                <Users className="text-white" size={32} />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-display mb-4 text-neutral-900"
              >
                {content.title || "About LogiSmart"}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-body-lg text-neutral-700 mb-6"
              >
                {content.subtitle || "Your trusted partner in smart logistics solutions"}
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
                    backgroundImage: 'url(https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20"></div>
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
                  <Target className="text-indigo-500" size={28} />
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
                  <Award className="text-purple-500" size={28} />
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
                  <TrendingUp className="text-pink-500" size={28} />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Who We Are Section */}
      <section className="py-16 lg:py-20 bg-white">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {(() => {
                const whoWeAreSection = sections.find(s => s.title === "Who We Are")
                const sectionImage = whoWeAreSection?.image
                const imageUrl = sectionImage ? getImageUrl(sectionImage) : 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop'
                return (
                  <div 
                    className="rounded-2xl overflow-hidden shadow-lg"
                    style={{
                      backgroundImage: `url(${imageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      aspectRatio: '4/3'
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-secondary-500/20"></div>
                  </div>
                )
              })()}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-h2 mb-4">Who We Are</h2>
              <p className="text-body text-neutral-700 mb-6 leading-relaxed">
                {sections.find(s => s.title === "Who We Are")?.content || aboutContent.whoWeAre}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {aboutContent.stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="text-center p-4 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg"
                  >
                    <div className="text-3xl font-bold gradient-text mb-1">{stat.number}</div>
                    <div className="text-sm text-neutral-600">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-16 lg:py-20 bg-neutral-200">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="h-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 gradient-bg rounded-lg flex items-center justify-center">
                    <Target className="text-white" size={24} />
                  </div>
                  <h2 className="text-h3">Our Mission</h2>
                </div>
                <p className="text-body text-neutral-700 leading-relaxed">
                  {sections.find(s => s.title === "Our Mission")?.content || aboutContent.mission}
                </p>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="h-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 gradient-bg rounded-lg flex items-center justify-center">
                    <Zap className="text-white" size={24} />
                  </div>
                  <h2 className="text-h3">Our Vision</h2>
                </div>
                <p className="text-body text-neutral-700 leading-relaxed">
                  {sections.find(s => s.title === "Our Vision")?.content || aboutContent.vision}
                </p>
              </Card>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Our Values Section */}
      <section className="py-16 lg:py-20 bg-white">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-h2 mb-4">Our Core Values</h2>
            <p className="text-body text-neutral-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {aboutContent.values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  duration: 0.5, 
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
                    <value.icon className="text-white" size={32} />
                  </motion.div>
                  <h3 className="text-h4 mb-2">{value.title}</h3>
                  <p className="text-body-sm text-neutral-600">{value.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 lg:py-20 bg-neutral-200">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-h2 mb-6">Why Choose LogiSmart?</h2>
              <div className="space-y-4">
                {aboutContent.whyChooseUs.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.3
                      }}
                      className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
                    >
                      <item.icon className="text-primary-600" size={20} />
                    </motion.div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                      <p className="text-body-sm text-neutral-600">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div 
                className="rounded-2xl overflow-hidden shadow-xl"
                style={{
                  backgroundImage: 'url(https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  aspectRatio: '4/3'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/30 to-secondary-500/30"></div>
              </div>
              {/* Floating Elements */}
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
                className="absolute -top-6 -left-6 bg-white p-4 rounded-full shadow-lg"
              >
                <Shield className="text-primary-500" size={24} />
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
                className="absolute -bottom-6 -right-6 bg-white p-4 rounded-full shadow-lg"
              >
                <Award className="text-secondary-500" size={24} />
              </motion.div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-20 gradient-bg relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"
          ></motion.div>
        </div>
        <Container className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center text-white max-w-3xl mx-auto"
          >
            <h2 className="text-h2 mb-4">Ready to Experience Smart Logistics?</h2>
            <p className="text-body-lg mb-8 opacity-90">
              Join thousands of satisfied customers who trust LogiSmart for their shipping needs
            </p>
            <Link to="/pricing">
              <Button variant="secondary" size="lg" className="group">
                Calculate Your Shipping Cost
                <ArrowRight className="inline-block ml-2 group-hover:translate-x-1 transition-transform" size={20} />
              </Button>
            </Link>
          </motion.div>
        </Container>
      </section>
    </div>
  )
}

export default About

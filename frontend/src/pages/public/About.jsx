import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Target, Users, Zap, Shield, TrendingUp, Award, CheckCircle, ArrowRight, BookOpen, Utensils, Shirt, Smartphone, Globe, Headphones } from 'lucide-react'
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

  // Scraped Content & Premium Structure
  // Default Content (Fallback)
  const defaultStory = [
    "We, Eagle Logistics, Estd in 2010 are one of the leading providers of courier and logistics services in India...",
    "We undertake door-to-door bulk pickup and deliveries...",
    "We also can arrange to pick your parcel from your door step..."
  ]

  const defaultServices = [
    { icon: Utensils, title: "Food Items", desc: "Pickles, Sweets, Spices & Homemade Snacks" },
    { icon: BookOpen, title: "Books & Docs", desc: "University Applications, Books & Stationery" },
    { icon: Shirt, title: "Fashion", desc: "Clothing, Footwear & Fabrics" },
    { icon: Smartphone, title: "Electronics", desc: "Gadgets, Devices & Appliances" },
  ]

  const defaultValues = [
    { icon: Shield, title: "Reliability", desc: "Stringent safety measures ensuring zero pilferage or damage." },
    { icon: Globe, title: "Global Reach", desc: "Covering USA, UK, Europe, Middle East & Far East." },
    { icon: TrendingUp, title: "Cost Effective", desc: "Unbelievably low prices with free cost-cutting consulting." },
    { icon: Headphones, title: "Customer Focused", desc: "Round the clock tracking and prompt delivery updates." },
  ]

  // Helper to merge CMS data with Icon defaults by index
  const mergeWithIcons = (cmsItems, defaults) => {
    if (!cmsItems || cmsItems.length === 0) return defaults
    return cmsItems.map((item, idx) => ({
      ...item,
      icon: defaults[idx % defaults.length].icon // Cycle through default icons if more items
    }))
  }

  // Scraped Content & Premium Structure
  const aboutContent = {
    hero: {
      title: content.hero?.title || "Connecting India to the World Since 2010",
      subtitle: content.hero?.subtitle || "Your trusted partner for international courier & cargo services. delivering happiness across borders.",
      image: content.hero?.image
    },
    story: (content.story && content.story.length > 0) ? content.story : defaultStory,
    services: mergeWithIcons(content.services, defaultServices),
    mission: content.mission || "Let us be the link between you and your loved ones. Have dedicated and passionate staff working for you. Give you, the Customer, full transparency throughout the delivery process.",
    why_choose_us: {
      title: content.why_choose_us?.title || "Why Choose Eagle?"
    },
    values: mergeWithIcons(content.values, defaultValues),
    consulting: {
      title: content.consulting?.title || "Free Logistics Consulting",
      desc: content.consulting?.desc || "We offer a quick and easy consulting service to show you how we can cut your costs. If you choose to ship with Eagle Express, we cover the consulting costs and save you even more."
    },
    stats: content.stats && content.stats.length > 0 ? content.stats : [
      { number: "2010", label: "Established" },
      { number: "Global", label: "Network" },
      { number: "100%", label: "Safe Delivery" },
      { number: "24/7", label: "Support" },
    ]
  }

  // Granular Styles
  const styles = pageData?.styles || {}

  // Hero Styles
  const heroStyle = {
    backgroundColor: styles.hero?.bgColor || '#171717',
    color: styles.hero?.textColor || '#d4d4d4'
  }
  const heroHeadingStyle = { color: styles.hero?.headingColor || '#ffffff' }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section
        className="relative py-20 lg:py-28 overflow-hidden"
        style={heroStyle}
      >
        {/* Dynamic Background Image */}
        <div className="absolute inset-0 z-0">
          {aboutContent.hero.image ? (
            <img
              src={getImageUrl(aboutContent.hero.image)}
              alt="About Hero"
              className="w-full h-full object-cover opacity-50"
            />
          ) : (
            // Default Fallback Gradient if no image (using dynamic colors)
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to bottom right, ${styles.hero?.bgColor || '#171717'}, ${styles.hero?.bgColor ? styles.hero.bgColor + 'dd' : '#262626'})`
              }}
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500 rounded-full blur-3xl opacity-20"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-500 rounded-full blur-3xl opacity-20"></div>
            </div>
          )}
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <Container className="relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <span className="inline-block py-1 px-3 rounded-full bg-white/10 text-white/90 text-sm font-medium mb-6 backdrop-blur-sm border border-white/10">
              Est. 2010 • Eagle Logistics
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight drop-shadow-xl" style={heroHeadingStyle}>
              {aboutContent.hero.title}
            </h1>
            <p className="text-xl max-w-2xl mx-auto leading-relaxed drop-shadow-md" style={{ color: styles.hero?.textColor || '#d4d4d4', opacity: 0.9 }}>
              {aboutContent.hero.subtitle}
            </p>
          </motion.div>
        </Container>
      </section>

      {/* The Story Section */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: styles.story?.bgColor || '#ffffff' }}>
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold mb-8" style={{ color: styles.story?.headingColor || '#171717' }}>
                Our Journey
              </h2>
              <div className="space-y-6 text-lg leading-relaxed" style={{ color: styles.story?.textColor || '#525252' }}>
                {aboutContent.story.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-12 pt-12 border-t border-neutral-100">
                {aboutContent.stats.map((stat, index) => (
                  <div key={index}>
                    <div className="text-3xl font-bold mb-1" style={{ color: styles.stats?.headingColor || '#2563eb' }}>{stat.number}</div>
                    <div className="text-sm font-medium uppercase tracking-wide" style={{ color: styles.stats?.textColor || '#737373' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl relative">
                <img
                  src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&q=80"
                  alt="Logistics Operations"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-8 left-8 text-white">
                  <p className="text-lg font-medium">Delivering Trust</p>
                  <p className="text-sm opacity-80">Across Borders & Boundaries</p>
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Things We Ship (Services) */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: styles.services?.bgColor || '#f5f5f5' }}>
        <Container>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4" style={{ color: styles.services?.headingColor || '#171717' }}>Things We Send</h2>
            <p className="text-lg" style={{ color: styles.services?.textColor || '#525252' }}>
              From homemade pickles to university documents, we ensure your packages reach safely.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {aboutContent.services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-neutral-100"
                style={{ backgroundColor: styles.services?.cardBgColor || '#ffffff' }}
              >
                <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 mb-6">
                  <service.icon size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: styles.services?.cardHeadingColor || '#171717' }}>{service.title}</h3>
                <p className="leading-relaxed" style={{ color: styles.services?.cardTextColor || '#525252' }}>
                  {service.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* Why Choose Us & Consulting */}
      <section className="py-16 lg:py-24 overflow-hidden" style={{ backgroundColor: styles.why_choose_us?.bgColor || '#ffffff' }}>
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6" style={{ color: styles.why_choose_us?.headingColor || '#171717' }}>
                {aboutContent.why_choose_us.title}
              </h2>
              <p className="text-lg mb-10 leading-relaxed" style={{ color: styles.why_choose_us?.textColor || '#525252' }}>
                {aboutContent.mission}
              </p>

              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-10">
                {aboutContent.values.map((val, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <val.icon className="text-primary-600" size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold mb-2" style={{ color: styles.values?.cardHeadingColor || '#171717' }}>{val.title}</h4>
                      <p className="text-sm leading-relaxed" style={{ color: styles.values?.cardTextColor || '#525252' }}>{val.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Consulting Card */}
            <div
              className="rounded-3xl p-10 relative overflow-hidden shadow-2xl"
              style={{
                backgroundColor: styles.consulting?.bgColor || '#171717',
                color: styles.consulting?.textColor || '#d4d4d4'
              }}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[100px] pointer-events-none"></div>

              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3" style={{ color: styles.consulting?.headingColor || '#ffffff' }}>
                <TrendingUp />
                {aboutContent.consulting.title}
              </h3>
              <p className="leading-relaxed mb-8 border-b border-white/10 pb-8" style={{ color: styles.consulting?.textColor || '#d4d4d4', borderColor: styles.consulting?.textColor ? styles.consulting.textColor + '30' : undefined }}>
                {aboutContent.consulting.desc}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
                <Link to="/contact">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full h-full text-sm sm:text-base px-2 sm:px-6"
                    style={styles.consulting?.buttonBgColor ? {
                      backgroundColor: styles.consulting.buttonBgColor,
                      backgroundImage: 'none',
                      color: styles.consulting.buttonTextColor,
                      borderColor: 'transparent'
                    } : undefined}
                  >
                    Get Free Consultation
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button
                    variant="outline"
                    className="w-full h-full hover:bg-white/10 text-sm sm:text-base px-2 sm:px-6"
                    style={styles.consulting?.secButtonTextColor ? {
                      borderColor: styles.consulting.secButtonBgColor || styles.consulting.secButtonTextColor,
                      color: styles.consulting.secButtonTextColor,
                      backgroundColor: styles.consulting.secButtonBgColor ? styles.consulting.secButtonBgColor : 'transparent'
                    } : { borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  >
                    Check Rates
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section
        className="py-16 lg:py-20 relative overflow-hidden"
        style={{
          backgroundColor: styles.cta?.bgColor || '#171717',
          color: styles.cta?.textColor || '#d4d4d4'
        }}
      >
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
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-h2 mb-4" style={{ color: styles.cta?.headingColor || '#ffffff' }}>Ready to Ship with Eagle?</h2>
            <p className="text-body-lg mb-8 opacity-90" style={{ color: styles.cta?.textColor || '#d4d4d4' }}>
              Join thousands of satisfied customers who trust Eagle Logistics for their shipping needs
            </p>
            <Link to="/pricing">
              <Button
                variant="secondary"
                size="lg"
                className="group"
                style={styles.cta?.buttonBgColor ? {
                  backgroundColor: styles.cta.buttonBgColor,
                  backgroundImage: 'none',
                  color: styles.cta.buttonTextColor
                } : undefined}
              >
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

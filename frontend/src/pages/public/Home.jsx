import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import * as LucideIcons from 'lucide-react' // Import all icons
import Container from '../../components/common/Container'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import HeroCarousel from '../../components/public/HeroCarousel'
import { publicAPI } from '../../services/api'

// Professional Courier Card Component
const CourierCard = ({ courier, logoUrl, index }) => {
  // ... (keep CourierCard logic same)
  const [logoError, setLogoError] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.4,
        delay: index * 0.05
      }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 }
      }}
    >
      <div className="h-full flex flex-col items-center justify-center p-6 bg-white border border-neutral-200 hover:border-neutral-300 hover:shadow-lg transition-all duration-300 rounded-lg">
        {/* Logo Display - Professional */}
        <div className="w-full h-32 flex items-center justify-center mb-4 bg-neutral-50 rounded-lg p-4">
          {!logoError ? (
            <img
              src={logoUrl}
              alt={courier.name}
              className="max-h-28 max-w-full object-contain"
              onError={() => setLogoError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-lg font-semibold text-neutral-800 text-center px-4">
                {courier.name}
              </span>
            </div>
          )}
        </div>

        {/* Company Name */}
        <h3 className="text-sm font-medium text-neutral-700 text-center leading-tight">
          {courier.name}
        </h3>
      </div>
    </motion.div>
  )
}

const Home = () => {
  // No manual ICON_MAP needed anymore

  const [pageData, setPageData] = useState(null)
  const [couriers, setCouriers] = useState([])
  const [loading, setLoading] = useState(true)

  // ... (keep courierLogos mapping)
  const courierLogos = {
    'blue dart': 'https://upload.wikimedia.org/wikipedia/commons/7/7d/Blue_Dart_Express_logo.svg',
    'bluedart': 'https://upload.wikimedia.org/wikipedia/commons/7/7d/Blue_Dart_Express_logo.svg',
    'blue-dart': 'https://upload.wikimedia.org/wikipedia/commons/7/7d/Blue_Dart_Express_logo.svg',
    // ... (rest of logos)
    'fedex': 'https://upload.wikimedia.org/wikipedia/commons/3/3b/FedEx_Express.svg',
    'fed ex': 'https://upload.wikimedia.org/wikipedia/commons/3/3b/FedEx_Express.svg',
    'fed-ex': 'https://upload.wikimedia.org/wikipedia/commons/3/3b/FedEx_Express.svg',
    'dtdc': 'https://upload.wikimedia.org/wikipedia/commons/1/1b/DTDC_logo.svg',
    'delhivery': 'https://companieslogo.com/img/orig/DELHIVERY.NS_BIG-356432.png',
    'ekart': 'https://logo.clearbit.com/ekartlogistics.com',
    'e-kart': 'https://logo.clearbit.com/ekartlogistics.com',
    'xpressbees': 'https://logo.clearbit.com/xpressbees.com',
    'xpress bees': 'https://logo.clearbit.com/xpressbees.com',
    'shiprocket': 'https://www.shiprocket.in/wp-content/uploads/2020/11/shiprocket-logo.svg',
    'ship rocket': 'https://www.shiprocket.in/wp-content/uploads/2020/11/shiprocket-logo.svg',
    'gati': 'https://logo.clearbit.com/gati.com',
    'first flight': 'https://logo.clearbit.com/firstflight.net',
    'firstflight': 'https://logo.clearbit.com/firstflight.net',
    'first-flight': 'https://logo.clearbit.com/firstflight.net',
    'professional courier': 'https://logo.clearbit.com/professionalcourier.com',
    'professionalcourier': 'https://logo.clearbit.com/professionalcourier.com',
    'professional-courier': 'https://logo.clearbit.com/professionalcourier.com',
    'dhl': 'https://upload.wikimedia.org/wikipedia/commons/7/77/DHL_Logo.svg',
    'ups': 'https://upload.wikimedia.org/wikipedia/commons/6/60/UPS_logo_2014.svg',
    'aramex': 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Aramex_logo.svg',
    'shadowfax': 'https://logo.clearbit.com/shadowfax.in',
    'pickrr': 'https://logo.clearbit.com/pickrr.com',
  }

  const getCourierLogo = (courier) => {
    // Priority 1: Uploaded logo
    if (courier.logo) {
      return `/uploads/${courier.logo}`
    }

    // Priority 2: Use backend proxy endpoint (bypasses CORS)
    const courierName = encodeURIComponent(courier.name)
    return `/api/public/logo/${courierName}`
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pageRes, couriersRes] = await Promise.all([
          publicAPI.getPage('home'),
          publicAPI.getCouriers(),
        ])

        setPageData(pageRes.data)
        setCouriers(couriersRes.data || [])

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
  const styles = pageData?.styles || {}

  // Content with defaults
  const partnersContent = pageData?.content?.partners || {
    title: "Our Courier Partners",
    desc: "We work with trusted courier services to ensure reliable delivery across India"
  }

  const ctaContent = pageData?.content?.cta || {
    title: "Ready to Ship?",
    subtitle: "Calculate your shipping cost now and get the best rates",
    buttonText: "Get Started"
  }

  // Get sections from pageData (from backend) instead of hardcoded
  const howItWorks = pageData?.content?.how_it_works || {
    enabled: true,
    title: "How It Works",
    steps: [
      { id: 1, title: "Drop Your Parcel", description: "Bring your parcel to our logistics center", icon: "" },
      { id: 2, title: "We Choose Best Courier", description: "We compare multiple courier partners and select the best option for you", icon: "" },
      { id: 3, title: "Fast & Safe Delivery", description: "Your parcel is delivered safely and on time", icon: "" },
    ]
  }
  const whyChooseUs = pageData?.content?.why_choose_us || {
    enabled: true,
    title: "Why Choose Us",
    features: [
      { id: 1, title: "Best Prices", description: "We compare multiple vendors to get you the best rates", icon: "" },
      { id: 2, title: "Fast Delivery", description: "Quick and reliable delivery options", icon: "" },
      { id: 3, title: "Easy Tracking", description: "Track your parcels across multiple courier services", icon: "" },
    ]
  }

  const heroImages = pageData?.content?.heroImages
  const heroImage = pageData?.content?.heroImage // Fallback for backward compatibility
  const getImageUrl = (filename) => {
    if (!filename) return null
    return `http://localhost:8000/uploads/${filename}`
  }

  // Prepare carousel images from uploaded images
  // Check if we have valid uploaded images
  const hasHeroImages = heroImages && Array.isArray(heroImages) && heroImages.length > 0
  const hasHeroImage = heroImage && heroImage.trim() !== '' && heroImage.trim() !== 'null'

  let carouselImages = null

  if (hasHeroImages) {
    // Use multiple hero images
    carouselImages = heroImages
      .filter(filename => filename && filename.trim() !== '' && filename.trim() !== 'null') // Filter out empty strings and 'null'
      .map((filename, index) => ({
        id: index + 1,
        url: getImageUrl(filename),
        alt: `Hero image ${index + 1}`,
        title: hero.headline || '',
        subtitle: hero.subheadline || ''
      }))

    // If all images were filtered out, set to null to use defaults
    if (carouselImages.length === 0) {
      carouselImages = null
    }
  } else if (hasHeroImage) {
    // Use single hero image - but we'll let HeroCarousel handle error fallback
    carouselImages = [{
      id: 1,
      url: getImageUrl(heroImage),
      alt: 'Hero image',
      title: hero.headline || '',
      subtitle: hero.subheadline || ''
    }]
  }
  // If carouselImages is still null, HeroCarousel will use default images

  return (
    <div className="min-h-screen">
      {/* Hero Section - Carousel or Hero Image as Background */}
      <section className="relative min-h-[600px] lg:min-h-[700px] overflow-hidden">
        {/* Background - Hero Images Carousel or Single Image or Default Carousel */}
        <div className="absolute inset-0 z-0">
          <HeroCarousel images={carouselImages || undefined} />
        </div>

        {/* Dark Overlay for Text Readability */}
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-neutral-900/70 via-neutral-800/60 to-neutral-900/50"></div>
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-transparent to-neutral-900/40"></div>

        {/* Content Overlay */}
        <Container className="relative z-20 h-full">
          <div className="min-h-[600px] lg:min-h-[700px] flex items-center py-20 lg:py-32">
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className="text-display mb-6 text-white drop-shadow-lg">
                  {hero.headline || "Smart Logistics. Best Price. Fast Delivery."}
                </h1>
                <p className="text-body-lg text-neutral-100 mb-8 drop-shadow-md">
                  {hero.subheadline || "We compare multiple courier partners to find you the best shipping rates and fastest delivery options."}
                </p>
                <Link to="/pricing">
                  <Button
                    size="lg"
                    className="group shadow-2xl"
                    style={styles.hero?.buttonBgColor ? {
                      backgroundColor: styles.hero.buttonBgColor,
                      color: styles.hero.buttonTextColor || '#ffffff',
                      border: 'none',
                      backgroundImage: 'none'
                    } : undefined}
                  >
                    {hero.cta || "Calculate Shipping Cost"}
                    <LucideIcons.ArrowRight className="inline-block ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </Container>
      </section>

      {/* How It Works Section */}
      {howItWorks.enabled && (
        <section
          className="py-20 relative"
          style={{ backgroundColor: styles.how_it_works?.bgColor || '#ffffff' }}
        >
          <Container className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-h2 mb-4" style={{ color: styles.how_it_works?.headingColor || '#171717' }}>{howItWorks.title}</h2>
              <p className="text-body max-w-2xl mx-auto" style={{ color: styles.how_it_works?.textColor || '#525252' }}>
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
                  <Card className="text-center h-full" style={{ backgroundColor: styles.how_it_works?.cardBgColor || '#ffffff' }}>
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                      style={{ backgroundColor: styles.how_it_works?.iconBgColor || '#3b82f6' }}
                    >
                      {(() => {
                        // Dynamic Icon Resolution
                        const IconComponent = (step.icon && LucideIcons[step.icon])
                          ? LucideIcons[step.icon]
                          : (index === 0 ? LucideIcons.Package : index === 1 ? LucideIcons.Search : index === 2 ? LucideIcons.Truck : LucideIcons.Package); // Fallback defaults
                        return <IconComponent size={32} style={{ color: styles.how_it_works?.iconColor || '#ffffff' }} />
                      })()}
                    </div>
                    <h3 className="text-h4 mb-3" style={{ color: styles.how_it_works?.cardHeadingColor || '#171717' }}>{step.title}</h3>
                    <p className="text-body-sm" style={{ color: styles.how_it_works?.cardTextColor || '#525252' }}>{step.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Courier Partners Section - Professional Logo Cards */}
      {couriers.length > 0 && partnersContent.enabled !== false && (
        <section
          className="py-20 relative"
          style={{ backgroundColor: styles.partners?.bgColor || '#e5e5e5' }}
        >
          <Container className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-h2 mb-4" style={{ color: styles.partners?.headingColor || '#171717' }}>{partnersContent.title}</h2>
              <p className="text-body max-w-2xl mx-auto" style={{ color: styles.partners?.textColor || '#525252' }}>
                {partnersContent.desc}
              </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {couriers
                .filter(c => c.active !== false)
                .sort((a, b) => (a.display_order || 999) - (b.display_order || 999))
                .map((courier, index) => {
                  const logoUrl = getCourierLogo(courier)

                  return (
                    <CourierCard
                      key={courier.id}
                      courier={courier}
                      logoUrl={logoUrl}
                      index={index}
                    />
                  )
                })}
            </div>

            {/* Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center mt-12"
            >
              <p className="text-body-sm text-neutral-600">
                <span className="font-semibold text-neutral-900">
                  {couriers.filter(c => c.active !== false).length}+
                </span> trusted courier partners
                <span className="mx-2">•</span>
                <span className="font-semibold text-neutral-900">100%</span> verified services
              </p>
            </motion.div>
          </Container>
        </section>
      )}

      {/* Why Choose Us Section - White Background */}
      {/* Why Choose Us Section */}
      {whyChooseUs.enabled && (
        <section
          className="py-20 relative"
          style={{ backgroundColor: styles.why_choose_us?.bgColor || '#ffffff' }}
        >
          <Container className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-h2 mb-4" style={{ color: styles.why_choose_us?.headingColor || '#171717' }}>{whyChooseUs.title}</h2>
              <p className="text-body max-w-2xl mx-auto" style={{ color: styles.why_choose_us?.textColor || '#525252' }}>
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
                  <Card className="h-full" style={{ backgroundColor: styles.why_choose_us?.cardBgColor || '#ffffff' }}>
                    <div className="mb-4">
                      {(() => {
                        const IconComponent = (feature.icon && LucideIcons[feature.icon])
                          ? LucideIcons[feature.icon]
                          : LucideIcons.CheckCircle2;
                        return <IconComponent size={28} className="text-primary-600" />
                      })()}
                    </div>
                    <h3 className="text-h4 mb-3" style={{ color: styles.why_choose_us?.cardHeadingColor || '#171717' }}>{feature.title}</h3>
                    <p className="text-body-sm" style={{ color: styles.why_choose_us?.cardTextColor || '#525252' }}>{feature.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* CTA Section */}
      <section
        className="py-20 relative overflow-hidden"
        style={{ backgroundColor: styles.cta?.bgColor || '#ea580c' }} // Fallback if no gradient
      >
        {/* Decorative elements - Only show if using default gradient or if specified? keeping simple for now */}
        {(!styles.cta?.bgColor) && (
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-primary-600 to-secondary-600 opacity-100"></div>
        )}

        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <Container className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
            style={{ color: styles.cta?.textColor || '#ffffff' }}
          >
            <h2 className="text-h2 mb-4" style={{ color: styles.cta?.headingColor || '#ffffff' }}>{ctaContent.title}</h2>
            <p className="text-body-lg mb-8 opacity-90" style={{ color: styles.cta?.textColor || '#ffffff' }}>
              {ctaContent.subtitle}
            </p>
            <Link to="/pricing">
              <Button
                variant="secondary"
                size="lg"
                style={styles.cta?.buttonBgColor ? {
                  backgroundColor: styles.cta.buttonBgColor,
                  backgroundImage: 'none',
                  color: styles.cta.buttonTextColor,
                  border: 'none'
                } : undefined}
              >
                {ctaContent.buttonText}
                <LucideIcons.ArrowRight className="inline-block ml-2" size={20} />
              </Button>
            </Link>
          </motion.div>
        </Container>
      </section>
    </div>
  )
}

export default Home

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plane, Truck, Anchor, Package, Heart, BookOpen, Utensils, Shirt, ChevronRight, Pill, Briefcase, Globe } from 'lucide-react'
import Container from '../../components/common/Container'
import Button from '../../components/common/Button'
import { Link } from 'react-router-dom'
import { publicAPI } from '../../services/api'

const Services = () => {
    const [activeTab, setActiveTab] = useState('personal')
    const [pageData, setPageData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchPageData = async () => {
            try {
                const response = await publicAPI.getPage('services')
                setPageData(response.data)
            } catch (error) {
                console.error('Failed to load services page data:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchPageData()
    }, [])

    const getImageUrl = (filename) => {
        if (!filename) return null
        if (filename.startsWith('http')) return filename
        return `http://localhost:8000/uploads/${filename}`
    }


    const getCurrentHeroImage = () => {
        // 1. Check for tab-specific custom hero image
        if (pageData?.content?.[activeTab]?.heroImage) {
            return getImageUrl(pageData.content[activeTab].heroImage)
        }
        // 2. Check for global custom hero image (legacy support)
        if (pageData?.content?.heroImage) {
            return getImageUrl(pageData.content.heroImage)
        }
        // 3. Fallback based on active tab
        return activeTab === 'personal'
            ? "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?q=80&w=2070&auto=format&fit=crop"
            : "https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=2070&auto=format&fit=crop"
    }

    // Default Data (Fallback)
    const defaultServiceData = {
        personal: {
            title: "Personal Courier Services",
            subtitle: "Sending love, care, and essentials to your family abroad.",
            items: [
                {
                    id: 'medicines',
                    title: 'Medicines & Wellness',
                    icon: Pill,
                    image: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&q=80",
                    highlight: "Critical Care & Vaccines",
                    description: "Ensuring the right equipment and supplies are in the right hands at the right time. We provide specialized handling for medicines, including cold chain logistics for vaccines.",
                    tags: ["Vaccines", "Ayurvedic", "Prescription Meds"]
                },
                {
                    id: 'food',
                    title: 'Food Items',
                    icon: Utensils,
                    image: "https://images.unsplash.com/photo-1623341214825-9f4f963727cb?w=800&q=80",
                    highlight: "Authentic Taste of Home",
                    description: "We handle the commodity of herbs, spices, and homemade snacks in a gentle and safe manner. Detailed packing ensures zero breakage for pickles and sweets.",
                    tags: ["Pickles", "Sweets", "Spices", "Homemade Snacks"]
                },
                {
                    id: 'student',
                    title: 'Student Express',
                    icon: BookOpen,
                    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80",
                    highlight: "University Applications",
                    description: "Special Messenger Services for exclusive deliveries of University Applications. We offer special discounts for students sending applications to universities in UK, USA, Australia.",
                    tags: ["Documents", "Applications", "Books"]
                },
                {
                    id: 'garments',
                    title: 'Fashion & Essentials',
                    icon: Shirt,
                    image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80",
                    highlight: "Clothing & Footwear",
                    description: "Door-to-door bulk pickup and delivery of clothing, footwear, and fabrics. Whether it's a gift for a wedding or essential winter wear for a student abroad.",
                    tags: ["Clothes", "Shoes", "Fabrics"]
                }
            ]
        },
        commercial: {
            title: "Commercial Logistics",
            subtitle: "Robust supply chain solutions for global businesses.",
            items: [
                {
                    id: 'air-cargo',
                    title: 'Air Cargo',
                    icon: Plane,
                    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80",
                    highlight: "Express 24-48 Hours",
                    description: "All your bulk consignments are sent through cargo flights to various destinations. Specialized handling for critical priority shipments and perishable commodities.",
                    tags: ["Express", "Perishables", "High Value"]
                },
                {
                    id: 'sea-freight',
                    title: 'Sea Freight',
                    icon: Anchor,
                    image: "https://images.unsplash.com/photo-1494412574643-35d324698420?w=800&q=80",
                    highlight: "Economical Bulk Shipping",
                    description: "Cost-effective solutions for large volume shipments. We provide FCL (Full Container Load) and LCL (Less than Container Load) services to major ports worldwide.",
                    tags: ["FCL/LCL", "Heavy Equipment", "Global"]
                },
                {
                    id: 'surface',
                    title: 'Surface Transport',
                    icon: Truck,
                    image: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800&q=80",
                    highlight: "Pan-India Network",
                    description: "Our own fleet of vehicles and leased railway wagons ensure seamless connectivity across India. Supported by container LCVs, we ensure added safety.",
                    tags: ["Domestic", "Road", "Rail"]
                },
                {
                    id: 'warehousing',
                    title: 'Warehousing & 3PL',
                    icon: Briefcase,
                    image: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80",
                    highlight: "Storage & Distribution",
                    description: "We provide godown facilities and function as a logistic service provider for procurement, storage, processing, packaging, and dispatch.",
                    tags: ["Storage", "Packaging", "Inventory"]
                }
            ]
        }
    }

    // Merge API data with default
    const content = pageData?.content || {}
    const serviceData = {
        personal: {
            ...defaultServiceData.personal,
            ...content.personal,
            items: content.personal?.items?.map((item, i) => ({
                ...defaultServiceData.personal.items[i],
                ...item,
                // Ensure icons persist
                icon: defaultServiceData.personal.items[i]?.icon
            })) || defaultServiceData.personal.items
        },
        commercial: {
            ...defaultServiceData.commercial,
            ...content.commercial,
            items: content.commercial?.items?.map((item, i) => ({
                ...defaultServiceData.commercial.items[i],
                ...item,
                icon: defaultServiceData.commercial.items[i]?.icon
            })) || defaultServiceData.commercial.items
        }
    }

    const currentData = serviceData[activeTab]
    const heroImage = getCurrentHeroImage()
    // Dynamic Hero Content with Fallbacks
    const heroTitle = pageData?.content?.hero?.headline || "What We Deliver"
    const heroSubtitle = pageData?.content?.hero?.subheadline || "From affectionate parcels to families abroad to critical commercial cargo, we handle it all with precision and care."


    return (
        <div className="min-h-screen bg-neutral-50">
            {/* Hero Section */}
            <section className="relative py-20 lg:py-28 overflow-hidden bg-neutral-900 text-white">
                {/* Dynamic Background Image */}
                <div className="absolute inset-0 z-0">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0"
                    >
                        <img
                            src={heroImage}
                            alt="Services Background"
                            className="w-full h-full object-cover opacity-50"
                        />
                    </motion.div>
                    {/* Gradient Overlay for Readability */}
                    <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/90 via-neutral-900/50 to-neutral-900/90" />
                </div>

                <Container className="relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-4xl mx-auto"
                    >
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight drop-shadow-2xl text-white">
                            {heroTitle}
                        </h1>
                        <p className="text-xl text-neutral-100 max-w-2xl mx-auto mb-12 drop-shadow-lg font-medium">
                            {heroSubtitle}
                        </p>

                        {/* Tab Switcher */}
                        <div className="inline-flex bg-white/10 p-1 rounded-full backdrop-blur-md border border-white/20 shadow-2xl">
                            <button
                                onClick={() => setActiveTab('personal')}
                                className={`py-3 px-8 rounded-full text-lg font-medium transition-all duration-300 ${activeTab === 'personal'
                                    ? 'bg-primary-600 text-white shadow-lg scale-105'
                                    : 'text-neutral-300 hover:text-white'
                                    }`}
                            >
                                Personal Courier
                            </button>
                            <button
                                onClick={() => setActiveTab('commercial')}
                                className={`py-3 px-8 rounded-full text-lg font-medium transition-all duration-300 ${activeTab === 'commercial'
                                    ? 'bg-secondary-600 text-white shadow-lg scale-105'
                                    : 'text-neutral-300 hover:text-white'
                                    }`}
                            >
                                Commercial Logistics
                            </button>
                        </div>
                    </motion.div>
                </Container>
            </section>

            {/* Content Section */}
            <section className="py-16 lg:py-24">
                <Container>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="text-center mb-16">
                                <h2 className="text-3xl font-bold text-neutral-900 mb-4">{currentData.title}</h2>
                                <p className="text-lg text-neutral-600">{currentData.subtitle}</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                {currentData.items.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: index * 0.1 }}
                                        className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-neutral-100 group flex flex-col h-full"
                                    >
                                        {/* Image Section */}
                                        <div className="h-48 overflow-hidden relative">
                                            <img
                                                src={getImageUrl(item.image)}
                                                alt={item.title}
                                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                            />
                                            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/60 to-transparent"></div>
                                            <div className="absolute bottom-4 left-6 text-white font-medium text-sm flex items-center gap-2">
                                                <span className={`${activeTab === 'personal' ? 'bg-primary-500' : 'bg-secondary-500'} p-1.5 rounded-lg`}>
                                                    {item.icon && <item.icon size={16} />}
                                                </span>
                                                {item.highlight}
                                            </div>
                                        </div>

                                        <div className="p-8 flex-1 flex flex-col">
                                            {/* Header removed from here as it's now overlay on image */}
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-xl font-bold text-neutral-900">{item.title}</h3>
                                            </div>

                                            <p className="text-neutral-600 leading-relaxed mb-6 text-sm flex-1">
                                                {item.description}
                                            </p>

                                            <div className="flex flex-wrap gap-2 mt-auto">
                                                {item.tags.map(tag => (
                                                    <span key={tag} className="px-3 py-1 bg-neutral-100 text-neutral-600 text-xs font-medium rounded-full">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </Container>
            </section>

            {/* CTA Band */}
            <section className="py-20 bg-neutral-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80')] bg-cover bg-center opacity-10"></div>
                <Container className="relative z-10 text-center">
                    <h2 className="text-3xl lg:text-4xl font-bold mb-6">Ready to Ship?</h2>
                    <p className="text-xl text-neutral-300 mb-8 max-w-2xl mx-auto">
                        Get an instant quote for your shipment or talk to our logistics experts for a custom solution.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link to="/pricing">
                            <Button variant="primary" size="lg">
                                Calculate Rate
                            </Button>
                        </Link>
                        <Link to="/contact">
                            <Button variant="outline" className="border-white text-white hover:bg-white/10">
                                Contact Support
                            </Button>
                        </Link>
                    </div>
                </Container>
            </section>
        </div>
    )
}

export default Services

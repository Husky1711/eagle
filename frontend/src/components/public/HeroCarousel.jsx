import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const HeroCarousel = ({ images = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  // Default sample images if none provided
  const defaultImages = [
    {
      id: 1,
      url: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200&h=600&fit=crop',
      alt: 'Fast delivery truck on highway',
      title: 'Fast & Reliable Delivery',
      subtitle: 'We ensure your packages reach on time, every time'
    },
    {
      id: 2,
      url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&h=600&fit=crop',
      alt: 'Warehouse logistics',
      title: 'Smart Logistics Solutions',
      subtitle: 'Optimized routes for maximum efficiency'
    },
    {
      id: 3,
      url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=600&fit=crop',
      alt: 'Global shipping network',
      title: 'Worldwide Coverage',
      subtitle: 'Ship anywhere, anytime with confidence'
    },
    {
      id: 4,
      url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&h=600&fit=crop',
      alt: 'Package tracking',
      title: 'Real-time Tracking',
      subtitle: 'Track your shipments every step of the way'
    }
  ]

  const carouselImages = images.length > 0 ? images : defaultImages

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % carouselImages.length)
    }, 5000) // Auto-advance every 5 seconds

    return () => clearInterval(timer)
  }, [carouselImages.length])

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  }

  const swipeConfidenceThreshold = 10000
  const swipePower = (offset, velocity) => {
    return Math.abs(offset) * velocity
  }

  const paginate = (newDirection) => {
    setDirection(newDirection)
    if (newDirection === 1) {
      setCurrentIndex((prev) => (prev + 1) % carouselImages.length)
    } else {
      setCurrentIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)
    }
  }

  const goToSlide = (index) => {
    setDirection(index > currentIndex ? 1 : -1)
    setCurrentIndex(index)
  }

  return (
    <div className="relative w-full h-full overflow-hidden group">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x)

            if (swipe < -swipeConfidenceThreshold) {
              paginate(1)
            } else if (swipe > swipeConfidenceThreshold) {
              paginate(-1)
            }
          }}
          className="absolute inset-0"
        >
          <div className="relative w-full h-full">
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${carouselImages[currentIndex].url})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover'
              }}
            />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows - Higher z-index to be above overlay */}
      <button
        onClick={() => paginate(-1)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/95 hover:bg-white text-neutral-800 p-3 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={() => paginate(1)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/95 hover:bg-white text-neutral-800 p-3 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm"
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots Indicator - Higher z-index */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex space-x-2">
        {carouselImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'w-8 bg-white shadow-lg'
                : 'w-2.5 bg-white/70 hover:bg-white/90'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar - Higher z-index */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 z-30">
        <motion.div
          className="h-full bg-white/90"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 5, ease: 'linear' }}
          key={currentIndex}
        />
      </div>
    </div>
  )
}

export default HeroCarousel


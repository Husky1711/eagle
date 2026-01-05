import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const HeroCarousel = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [imageErrors, setImageErrors] = useState(new Set())
  const [imagesLoaded, setImagesLoaded] = useState(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const imageRefs = useRef({})

  // Default gradient backgrounds (no external dependencies, no CORB issues)
  const defaultImages = [
    {
      id: 1,
      url: null, // Use gradient instead
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      alt: 'Fast delivery truck on highway',
      title: 'Fast & Reliable Delivery',
      subtitle: 'We ensure your packages reach on time, every time'
    },
    {
      id: 2,
      url: null,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      alt: 'Warehouse logistics',
      title: 'Smart Logistics Solutions',
      subtitle: 'Optimized routes for maximum efficiency'
    },
    {
      id: 3,
      url: null,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      alt: 'Global shipping network',
      title: 'Worldwide Coverage',
      subtitle: 'Ship anywhere, anytime with confidence'
    },
    {
      id: 4,
      url: null,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      alt: 'Package tracking',
      title: 'Real-time Tracking',
      subtitle: 'Track your shipments every step of the way'
    }
  ]

  // Use default images if no images provided, if images array is empty, or if all images failed to load
  const hasValidImages = images && Array.isArray(images) && images.length > 0
  const allImagesFailed = hasValidImages && imageErrors.size === images.length

  const carouselImages = (hasValidImages && !allImagesFailed) ? images : defaultImages

  // Reset image errors and loading state when images change
  useEffect(() => {
    setImageErrors(new Set())
    setImagesLoaded(new Set())
    setIsLoading(true)
    imageRefs.current = {}
  }, [images])

  // Preload images before starting carousel
  useEffect(() => {
    if (!hasValidImages || carouselImages === defaultImages) {
      setIsLoading(false)
      return
    }

    let loadedCount = 0
    const totalImages = carouselImages.length
    const preloadPromises = []

    carouselImages.forEach((img, index) => {
      if (img.url) {
        const imgElement = new Image()
        imgElement.crossOrigin = 'anonymous'

        const promise = new Promise((resolve, reject) => {
          imgElement.onload = () => {
            setImagesLoaded(prev => new Set([...prev, index]))
            loadedCount++
            if (loadedCount === totalImages) {
              setIsLoading(false)
            }
            resolve()
          }
          imgElement.onerror = () => {
            setImageErrors(prev => new Set([...prev, index]))
            loadedCount++
            if (loadedCount === totalImages) {
              setIsLoading(false)
            }
            reject()
          }
        })

        imgElement.src = img.url
        preloadPromises.push(promise)
        imageRefs.current[index] = imgElement
      } else {
        loadedCount++
        if (loadedCount === totalImages) {
          setIsLoading(false)
        }
      }
    })

    // Set timeout to stop loading after 5 seconds even if images don't load
    const timeout = setTimeout(() => {
      setIsLoading(false)
    }, 5000)

    return () => {
      clearTimeout(timeout)
      Object.values(imageRefs.current).forEach(img => {
        if (img && img.onload) {
          img.onload = null
          img.onerror = null
        }
      })
    }
  }, [carouselImages, hasValidImages])

  // Auto-advance carousel (only after images are loaded)
  useEffect(() => {
    if (isLoading) return

    const timer = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % carouselImages.length)
    }, 5000) // Auto-advance every 5 seconds

    return () => clearInterval(timer)
  }, [carouselImages.length, isLoading])

  // Smooth slide animation variants (no spring, no flashing)
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
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

  const currentImage = carouselImages[currentIndex]
  const hasImageUrl = currentImage?.url && !imageErrors.has(currentIndex)
  const hasGradient = currentImage?.gradient
  const imageLoaded = imagesLoaded.has(currentIndex) || !hasValidImages || hasGradient

  return (
    <div className="relative w-full h-full overflow-hidden group">
      {/* Loading placeholder */}
      {isLoading && hasValidImages && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-secondary-500 animate-pulse" />
      )}

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'tween', ease: 'easeInOut', duration: 0.5 },
            opacity: { duration: 0.3 }
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
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
            {/* Background - Image or Gradient */}
            {hasImageUrl && imageLoaded ? (
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url(${currentImage.url})`,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover'
                }}
              >
                {/* Actual img element for better error handling */}
                <img
                  src={currentImage.url}
                  alt={currentImage.alt || 'Hero image'}
                  className="hidden"
                  onError={() => {
                    setImageErrors(prev => new Set([...prev, currentIndex]))
                  }}
                  onLoad={() => {
                    setImagesLoaded(prev => new Set([...prev, currentIndex]))
                  }}
                />
              </div>
            ) : hasGradient ? (
              <div
                className="absolute inset-0"
                style={{
                  background: currentImage.gradient
                }}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-secondary-500" />
            )}
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
            className={`h-2.5 rounded-full transition-all duration-300 ${index === currentIndex
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

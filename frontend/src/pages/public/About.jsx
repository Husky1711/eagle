import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Container from '../../components/common/Container'
import Card from '../../components/common/Card'
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
          <h1 className="text-display mb-6">
            {content.title || "About Us"}
          </h1>
        </motion.div>

        {/* Content Sections */}
        <div className="max-w-4xl mx-auto space-y-12">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card>
                <h2 className="text-h3 mb-4">{section.title}</h2>
                <div 
                  className="text-body text-neutral-600 prose prose-neutral max-w-none"
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              </Card>
            </motion.div>
          ))}

          {/* Default content if no sections */}
          {sections.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card>
                <h2 className="text-h3 mb-4">Who We Are</h2>
                <p className="text-body text-neutral-600 mb-6">
                  We are a logistics mediation center that helps customers find the best courier services at competitive prices.
                </p>
                <h2 className="text-h3 mb-4">Our Mission</h2>
                <p className="text-body text-neutral-600">
                  To simplify logistics by comparing multiple courier vendors and selecting the best option for our customers.
                </p>
              </Card>
            </motion.div>
          )}
        </div>
      </Container>
    </div>
  )
}

export default About

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Edit, FileText, Eye } from 'lucide-react'
import Container from '../../components/common/Container'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import { adminAPI } from '../../services/api'

const ContentManager = () => {
  const navigate = useNavigate()
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const pageList = [
    { id: 'home', name: 'Home Page', description: 'Hero section, How It Works, Courier Partners, Why Choose Us' },
    { id: 'pricing', name: 'Pricing Calculator', description: 'Calculator page content and labels' },
    { id: 'tracking', name: 'Tracking Page', description: 'Tracking page content and labels' },
    { id: 'about', name: 'About Us', description: 'About page content and sections' },
    { id: 'contact', name: 'Contact Us', description: 'Contact page content' },
  ]

  useEffect(() => {
    // Pages are predefined, no need to fetch
    setPages(pageList)
    setLoading(false)
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

  return (
    <Container>
      <div className="py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-h1">Content Manager</h1>
          <p className="text-neutral-600 mt-1">Edit content for all pages</p>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-200 text-error-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Pages Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pages.map((page) => (
            <motion.div
              key={page.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-primary-50 rounded-lg">
                      <FileText className="text-primary-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900">{page.name}</h3>
                      <p className="text-sm text-neutral-600 mt-1">{page.description}</p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="primary"
                    onClick={() => navigate(`/admin/content/${page.id}`)}
                    className="flex-1"
                  >
                    <Edit size={16} className="mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(`/${page.id === 'home' ? '' : page.id}`, '_blank')}
                    className="flex-1"
                  >
                    <Eye size={16} className="mr-2" />
                    View
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </Container>
  )
}

export default ContentManager


import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  FileText,
  Eye,
  MoreHorizontal,
  Calculator,
  Truck,
  Info,
  Mail,
  Home,
  Globe
} from 'lucide-react'
import Container from '../../components/common/Container'
import Button from '../../components/common/Button'
import { adminAPI } from '../../services/api'


// Utility function if not already present in project
const timeAgo = (dateString) => {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now - date) / 1000)

  if (seconds < 60) return `${seconds} seconds ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minutes ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hours ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} days ago`

  return date.toLocaleDateString()
}

const ContentManager = () => {
  const navigate = useNavigate()
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Static Configuration for Pages
  const pageConfig = {
    home: {
      name: 'Home Page',
      description: 'Hero, How it works, CTA',
      icon: Home,
      category: 'primary'
    },
    pricing: {
      name: 'Pricing Calculator',
      description: 'Calculator page content and labels',
      icon: Calculator,
      category: 'primary'
    },
    tracking: {
      name: 'Tracking Page',
      description: 'Tracking page content and labels',
      icon: Truck,
      category: 'primary'
    },
    services: {
      name: 'Services Page',
      description: 'Service offerings (Personal vs Commercial)',
      icon: Globe,
      category: 'primary'
    },
    about: {
      name: 'About Us',
      description: 'About page content and sections',
      icon: Info,
      category: 'utility'
    },
    contact: {
      name: 'Contact Us',
      description: 'Contact page content',
      icon: Mail,
      category: 'utility'
    },
    // Default fallback
    default: {
      name: 'Untitled Page',
      description: 'Website page',
      icon: FileText,
      category: 'utility'
    }
  }

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const response = await adminAPI.getPages()
        // Merge API data with local config
        const mergedPages = response.data.map(page => {
          const config = pageConfig[page.id] || pageConfig.default
          return {
            ...page,
            ...config,
            // Only overwrite name/desc if not present (though API currently doesn't provide them)
            name: config.name || page.id,
          }
        })
        setPages(mergedPages)
      } catch (err) {
        console.error('Failed to fetch pages:', err)
        setError('Failed to load pages')
      } finally {
        setLoading(false)
      }
    }

    fetchPages()
  }, [])

  const filteredPages = pages.filter(page =>
    page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const primaryPages = filteredPages.filter(p => p.category === 'primary')
  const utilityPages = filteredPages.filter(p => p.category === 'utility')

  const PageCard = ({ page }) => {
    const Icon = page.icon

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-neutral-200 p-6 flex flex-col h-full hover:shadow-md transition-shadow"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-4">
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600 h-fit">
              <Icon size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900 text-lg">{page.name}</h3>
              <p className="text-sm text-neutral-500 mt-1">{page.description}</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${page.published
            ? 'bg-green-100 text-green-700'
            : 'bg-yellow-100 text-yellow-700'
            }`}>
            {page.published ? 'LIVE' : 'DRAFT'}
          </span>
        </div>

        <div className="mt-auto pt-6">
          <div className="flex flex-col gap-1 mb-6 text-xs text-neutral-500">
            <p>Last updated: {timeAgo(page.lastModified)}</p>
            <p>By: {page.author || 'Admin'}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/admin/content/${page.id}`)}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Edit Content
            </button>
            <button
              onClick={() => window.open(`/${page.id === 'home' ? '' : page.id}`, '_blank')}
              className="px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 text-neutral-700 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
            >
              <Eye size={16} />
              Preview
            </button>
            <button className="px-2 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 text-neutral-700 transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Content Manager</h1>
            <p className="text-neutral-500 mt-1">Manage and publish website content</p>
          </div>

          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
              <input
                type="text"
                placeholder="Search content"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-neutral-200 rounded-lg w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors whitespace-nowrap">
              <Plus size={20} />
              Add New Page
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Primary Pages */}
        {primaryPages.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Primary Pages</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {primaryPages.map(page => (
                <PageCard key={page.id} page={page} />
              ))}
            </div>
          </div>
        )}

        {/* Utility Pages */}
        {utilityPages.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Utility Pages</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {utilityPages.map(page => (
                <PageCard key={page.id} page={page} />
              ))}
            </div>
          </div>
        )}

        {filteredPages.length === 0 && (
          <div className="text-center py-20 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
            <p className="text-neutral-500">No pages found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </Container>
  )
}

export default ContentManager

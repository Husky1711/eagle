import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Save, ArrowLeft } from 'lucide-react'
import Container from '../../components/common/Container'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import { adminAPI } from '../../services/api'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

const ContentEditor = () => {
  const { pageId } = useParams()
  const navigate = useNavigate()
  const [pageData, setPageData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (pageId) {
      fetchPageData()
    }
  }, [pageId])

  const fetchPageData = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getPageContent(pageId)
      setPageData(response.data)
    } catch (error) {
      setError('Failed to load page content')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      
      await adminAPI.updatePageContent(pageId, pageData)
      
      setSuccess('Page updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to update page')
    } finally {
      setSaving(false)
    }
  }

  const updateContent = (path, value) => {
    setPageData(prev => {
      const newData = { ...prev }
      const keys = path.split('.')
      let current = newData
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {}
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      return newData
    })
  }

  if (loading) {
    return (
      <Container>
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        </div>
      </Container>
    )
  }

  if (!pageData) {
    return (
      <Container>
        <div className="py-20 text-center">
          <p className="text-neutral-600">Page not found</p>
          <Button onClick={() => navigate('/admin/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </Container>
    )
  }

  return (
    <div className="py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/content')}
            >
              <ArrowLeft size={20} className="mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-h1 capitalize">{pageId} Page Editor</h1>
              <p className="text-neutral-600 mt-1">Edit page content and settings</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="secondary"
              onClick={handleSave}
              disabled={saving}
            >
              <Save size={20} className="mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-error-50 border border-error-200 text-error-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-success-50 border border-success-200 text-success-600 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Meta Information */}
          <Card>
            <h2 className="text-h3 mb-6">Meta Information</h2>
            
            <div className="space-y-4">
              <Input
                label="Page Title"
                value={pageData.meta?.title || ''}
                onChange={(e) => updateContent('meta.title', e.target.value)}
              />
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Meta Description
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  rows="3"
                  value={pageData.meta?.description || ''}
                  onChange={(e) => updateContent('meta.description', e.target.value)}
                />
              </div>

              <Input
                label="Keywords"
                value={pageData.meta?.keywords || ''}
                onChange={(e) => updateContent('meta.keywords', e.target.value)}
                placeholder="keyword1, keyword2, keyword3"
              />
            </div>
          </Card>

          {/* Page Settings */}
          <Card>
            <h2 className="text-h3 mb-6">Page Settings</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                <div>
                  <p className="font-medium text-neutral-900">Published</p>
                  <p className="text-sm text-neutral-600">Page visibility on website</p>
                </div>
                <button
                  onClick={() => updateContent('published', !pageData.published)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    pageData.published ? 'bg-primary-500' : 'bg-neutral-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      pageData.published ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {pageData.lastModified && (
                <div className="p-4 bg-neutral-50 rounded-lg">
                  <p className="text-sm text-neutral-600">Last Modified</p>
                  <p className="font-medium text-neutral-900">
                    {new Date(pageData.lastModified).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Content Editor */}
        <Card className="mt-8">
          <h2 className="text-h3 mb-6">Page Content</h2>
          
          <div className="space-y-6">
            {/* Hero Section */}
            {pageData.content?.hero && (
              <div>
                <h3 className="text-h4 mb-4">Hero Section</h3>
                <div className="space-y-4">
                  <Input
                    label="Headline"
                    value={pageData.content.hero.headline || ''}
                    onChange={(e) => updateContent('content.hero.headline', e.target.value)}
                  />
                  <Input
                    label="Subheadline"
                    value={pageData.content.hero.subheadline || ''}
                    onChange={(e) => updateContent('content.hero.subheadline', e.target.value)}
                  />
                  <Input
                    label="CTA Button Text"
                    value={pageData.content.hero.cta || ''}
                    onChange={(e) => updateContent('content.hero.cta', e.target.value)}
                  />
                  <Input
                    label="CTA Link"
                    value={pageData.content.hero.ctaLink || ''}
                    onChange={(e) => updateContent('content.hero.ctaLink', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Rich Text Content */}
            {pageData.content?.sections && (
              <div>
                <h3 className="text-h4 mb-4">Content Sections</h3>
                {pageData.content.sections.map((section, index) => (
                  <div key={index} className="mb-6 p-4 border border-neutral-200 rounded-lg">
                    <Input
                      label="Section Title"
                      value={section.title || ''}
                      onChange={(e) => {
                        const newSections = [...pageData.content.sections]
                        newSections[index] = { ...section, title: e.target.value }
                        updateContent('content.sections', newSections)
                      }}
                    />
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Section Content
                      </label>
                      <ReactQuill
                        theme="snow"
                        value={section.content || ''}
                        onChange={(value) => {
                          const newSections = [...pageData.content.sections]
                          newSections[index] = { ...section, content: value }
                          updateContent('content.sections', newSections)
                        }}
                        modules={{
                          toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            ['link'],
                            ['clean']
                          ]
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Simple Text Content */}
            {pageData.content?.title && !pageData.content?.hero && (
              <div>
                <h3 className="text-h4 mb-4">Page Title</h3>
                <Input
                  value={pageData.content.title || ''}
                  onChange={(e) => updateContent('content.title', e.target.value)}
                />
              </div>
            )}

            {pageData.content?.subtitle && (
              <div>
                <h3 className="text-h4 mb-4">Page Subtitle</h3>
                <Input
                  value={pageData.content.subtitle || ''}
                  onChange={(e) => updateContent('content.subtitle', e.target.value)}
                />
              </div>
            )}
          </div>
        </Card>
    </div>
  )
}

export default ContentEditor


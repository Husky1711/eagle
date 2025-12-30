import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Save,
  ArrowLeft,
  ChevronDown,
  LayoutTemplate,
  Settings,
  Image as ImageIcon,
  List,
  Type,
  Globe,
  CheckCircle2,
  ExternalLink,
  Eye
} from 'lucide-react'
import Container from '../../components/common/Container'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import ImageSelector from '../../components/admin/ImageSelector'
import MultiImageSelector from '../../components/admin/MultiImageSelector'
import { adminAPI } from '../../services/api'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

// --- Components ---

const SectionBlock = ({ title, description, icon: Icon, isOpen, onToggle, children, status = 'complete' }) => {
  return (
    <motion.div
      initial={false}
      className={`bg-white border rounded-xl overflow-hidden mb-4 transition-all duration-200 ${isOpen ? 'border-primary-200 shadow-md ring-1 ring-primary-100' : 'border-neutral-200 hover:border-neutral-300'
        }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-neutral-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-lg ${isOpen ? 'bg-primary-50 text-primary-600' : 'bg-neutral-100 text-neutral-500'}`}>
            <Icon size={20} />
          </div>
          <div>
            <h3 className={`font-semibold text-lg ${isOpen ? 'text-primary-900' : 'text-neutral-900'}`}>
              {title}
            </h3>
            {description && <p className="text-sm text-neutral-500 mt-0.5">{description}</p>}
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-neutral-400"
        >
          <ChevronDown size={20} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="p-6 border-t border-neutral-100 bg-white">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const EmptyState = ({ message }) => (
  <div className="text-center py-12 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
    <p className="text-neutral-500">{message}</p>
  </div>
)

// --- Main Page Component ---

const ContentEditor = () => {
  const { pageId } = useParams()
  const navigate = useNavigate()

  // State
  const [pageData, setPageData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // UI State
  const [activeSection, setActiveSection] = useState('meta') // 'meta', 'hero', 'sections', etc.

  useEffect(() => {
    if (pageId) fetchPageData()
  }, [pageId])

  const fetchPageData = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getPageContent(pageId)
      setPageData(response.data)
      // Auto-open hero if meta is mostly done (logic could be smarter, but defaulting to meta is safe)
      setActiveSection('meta')
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
      setSuccess('All changes saved successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to update page')
    } finally {
      setSaving(false)
    }
  }

  // Deep update helper
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

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section)
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

  if (!pageData) return null

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-neutral-200 shadow-sm">
        <Container>
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/content')}
                className="p-2 -ml-2 text-neutral-500 hover:bg-neutral-100 rounded-full transition-colors"
                title="Back to Content Manager"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="h-6 w-px bg-neutral-200"></div>
              <div>
                <h1 className="text-lg font-bold text-neutral-900 capitalize flex items-center gap-2">
                  {pageId.replace('-', ' ')} Page
                  {pageData.published && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">LIVE</span>
                  )}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-400 font-medium hidden md:block">
                {saving ? 'Saving...' : success ? 'Saved' : 'Unsaved changes'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/${pageId === 'home' ? '' : pageId}`, '_blank')}
                className="hidden sm:flex"
              >
                <Eye size={16} className="mr-2" />
                Preview
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="min-w-[100px]"
              >
                {saving ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </Container>
      </div>

      <Container>
        <div className="max-w-4xl mx-auto py-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <CheckCircle2 size={16} />
              {success}
            </div>
          )}

          <div className="space-y-6">
            {/* 1. Page Settings & Meta (Collapsed by default usually, but good to check first) */}
            <SectionBlock
              title="Page Settings & SEO"
              description="URL slug, meta tags, and visibility settings"
              icon={Settings}
              isOpen={activeSection === 'meta'}
              onToggle={() => toggleSection('meta')}
            >
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-neutral-900 mb-3 block">Visibility</h4>
                    <div className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-neutral-900">Published Status</span>
                        <span className="text-xs text-neutral-500">{pageData.published ? 'Visible to visitors' : 'Hidden from site'}</span>
                      </div>
                      <button
                        onClick={() => updateContent('published', !pageData.published)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${pageData.published ? 'bg-primary-600' : 'bg-neutral-300'
                          }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pageData.published ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                  <Input
                    label="Page Title (Meta Title)"
                    value={pageData.meta?.title || ''}
                    onChange={(e) => updateContent('meta.title', e.target.value)}
                    placeholder="e.g. Best Courier Services - LogiSmart"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Meta Description</label>
                    <textarea
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      rows="4"
                      placeholder="Brief summary for search results..."
                      value={pageData.meta?.description || ''}
                      onChange={(e) => updateContent('meta.description', e.target.value)}
                    />
                  </div>
                  <Input
                    label="Keywords"
                    value={pageData.meta?.keywords || ''}
                    onChange={(e) => updateContent('meta.keywords', e.target.value)}
                    placeholder="courier, logistics, fast delivery"
                  />
                </div>
              </div>
            </SectionBlock>

            {/* 2. Hero Section */}
            {pageData.content?.hero && (
              <SectionBlock
                title="Hero Section"
                description="Main visual banner at the top of the page"
                icon={LayoutTemplate}
                isOpen={activeSection === 'hero'}
                onToggle={() => toggleSection('hero')}
              >
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Input
                      label="Headline"
                      value={pageData.content.hero.headline || ''}
                      onChange={(e) => updateContent('content.hero.headline', e.target.value)}
                      className="font-bold text-lg"
                    />
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-neutral-700">Subheadline</label>
                      <textarea
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        rows="3"
                        value={pageData.content.hero.subheadline || ''}
                        onChange={(e) => updateContent('content.hero.subheadline', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="CTA Button Text"
                        value={pageData.content.hero.cta || ''}
                        onChange={(e) => updateContent('content.hero.cta', e.target.value)}
                      />
                      <Input
                        label="CTA Link"
                        value={pageData.content.hero.ctaLink || ''}
                        onChange={(e) => updateContent('content.hero.ctaLink', e.target.value)}
                        placeholder="/pricing"
                        icon={Globe}
                      />
                    </div>
                  </div>

                  <div>
                    {pageId === 'home' ? (
                      <MultiImageSelector
                        label="Hero Carousel Images"
                        value={pageData.content.heroImages || (pageData.content.heroImage ? [pageData.content.heroImage] : [])}
                        onChange={(value) => {
                          updateContent('content.heroImages', value)
                          // Legacy support
                          if (value.length > 0) updateContent('content.heroImage', value[0])
                        }}
                        maxImages={5}
                        helperText="Recommended size: 1920x800px"
                      />
                    ) : (
                      <ImageSelector
                        label="Hero Background Image"
                        value={pageData.content.heroImage || ''}
                        onChange={(value) => updateContent('content.heroImage', value)}
                        helperText="Recommended size: 1920x600px"
                      />
                    )}
                  </div>
                </div>
              </SectionBlock>
            )}

            {/* 3. Dynamic Sections (Home Specific) */}
            {pageId === 'home' && (
              <>
                {/* How It Works */}
                <SectionBlock
                  title="How It Works"
                  description="Three-step process explanation"
                  icon={List}
                  isOpen={activeSection === 'how_it_works'}
                  onToggle={() => toggleSection('how_it_works')}
                >
                  <div className="mb-6 flex items-center justify-between">
                    <Input
                      value={pageData.content?.how_it_works?.title || 'How It Works'}
                      onChange={(e) => {
                        const current = pageData.content?.how_it_works || { enabled: true, steps: [] }
                        updateContent('content.how_it_works', { ...current, title: e.target.value })
                      }}
                      className="font-semibold max-w-md"
                      placeholder="Section Title"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-neutral-500">Enable Section</span>
                      <button
                        onClick={() => {
                          const current = pageData.content?.how_it_works || { enabled: true, steps: [] }
                          updateContent('content.how_it_works', { ...current, enabled: !current.enabled })
                        }}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${(pageData.content?.how_it_works?.enabled !== false) ? 'bg-primary-600' : 'bg-neutral-300'
                          }`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${(pageData.content?.how_it_works?.enabled !== false) ? 'translate-x-5' : 'translate-x-1'
                          }`} />
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    {(pageData.content?.how_it_works?.steps || [1, 2, 3].map(i => ({ id: i, title: '', description: '' }))).map((step, index) => (
                      <div key={index} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm mb-3">
                          {index + 1}
                        </div>
                        <Input
                          label="Step Title"
                          value={step.title || ''}
                          onChange={(e) => {
                            const current = pageData.content?.how_it_works || { steps: [] }
                            const newSteps = [...(current.steps || [])]
                            newSteps[index] = { ...step, title: e.target.value }
                            updateContent('content.how_it_works', { ...current, steps: newSteps })
                          }}
                          className="mb-3"
                        />
                        <textarea
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-1 focus:ring-primary-500"
                          rows="3"
                          placeholder="Description..."
                          value={step.description || ''}
                          onChange={(e) => {
                            const current = pageData.content?.how_it_works || { steps: [] }
                            const newSteps = [...(current.steps || [])]
                            newSteps[index] = { ...step, description: e.target.value }
                            updateContent('content.how_it_works', { ...current, steps: newSteps })
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </SectionBlock>

                {/* Why Choose Us */}
                <SectionBlock
                  title="Why Choose Us"
                  description="Feature highlights grid"
                  icon={CheckCircle2}
                  isOpen={activeSection === 'why_choose_us'}
                  onToggle={() => toggleSection('why_choose_us')}
                >
                  <div className="mb-6">
                    <Input
                      value={pageData.content?.why_choose_us?.title || 'Why Choose Us'}
                      onChange={(e) => {
                        const current = pageData.content?.why_choose_us || { enabled: true, features: [] }
                        updateContent('content.why_choose_us', { ...current, title: e.target.value })
                      }}
                      className="font-semibold max-w-md"
                      label="Section Title"
                    />
                  </div>
                  <div className="space-y-4">
                    {(pageData.content?.why_choose_us?.features || [1, 2, 3].map(i => ({ id: i, title: '', description: '' }))).map((feature, index) => (
                      <div key={index} className="flex gap-4 p-4 border border-neutral-200 rounded-lg bg-neutral-50/50">
                        <div className="mt-2 text-neutral-400">
                          <CheckCircle2 size={20} />
                        </div>
                        <div className="flex-1 grid md:grid-cols-2 gap-4">
                          <Input
                            placeholder="Feature Title"
                            value={feature.title || ''}
                            onChange={(e) => {
                              const current = pageData.content?.why_choose_us || { features: [] }
                              const newFeatures = [...(current.features || [])]
                              newFeatures[index] = { ...feature, title: e.target.value }
                              updateContent('content.why_choose_us', { ...current, features: newFeatures })
                            }}
                          />
                          <Input
                            placeholder="Feature Description"
                            value={feature.description || ''}
                            onChange={(e) => {
                              const current = pageData.content?.why_choose_us || { features: [] }
                              const newFeatures = [...(current.features || [])]
                              newFeatures[index] = { ...feature, description: e.target.value }
                              updateContent('content.why_choose_us', { ...current, features: newFeatures })
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionBlock>
              </>
            )}

            {/* 4. Rich Text Sections (Generic) */}
            {pageData.content?.sections && pageData.content.sections.map((section, index) => (
              <SectionBlock
                key={index}
                title={section.title || `Content Section ${index + 1}`}
                description="Rich text block with optional image"
                icon={Type}
                isOpen={activeSection === `section_${index}`}
                onToggle={() => toggleSection(`section_${index}`)}
              >
                <div className="space-y-6">
                  <Input
                    label="Section Title"
                    value={section.title || ''}
                    onChange={(e) => {
                      const newSections = [...pageData.content.sections]
                      newSections[index] = { ...section, title: e.target.value }
                      updateContent('content.sections', newSections)
                    }}
                  />

                  <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Content Body</label>
                      <div className="bg-white rounded-lg overflow-hidden border border-neutral-300">
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
                              [{ 'header': [2, 3, false] }],
                              ['bold', 'italic', 'underline', 'link'],
                              [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                              ['clean']
                            ]
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <ImageSelector
                        label="Side Image"
                        value={section.image || ''}
                        onChange={(value) => {
                          const newSections = [...pageData.content.sections]
                          newSections[index] = { ...section, image: value }
                          updateContent('content.sections', newSections)
                        }}
                        helperText="Optional visualization"
                      />
                    </div>
                  </div>
                </div>
              </SectionBlock>
            ))}

            {/* 5. Fallback for Simple Pages (Title/Subtitle/Image) */}
            {(!pageData.content?.hero && !pageData.content?.sections) && (
              <SectionBlock
                title="Main Content"
                description="Primary page information"
                icon={Type}
                isOpen={activeSection === 'main'}
                onToggle={() => toggleSection('main')}
              >
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Input
                      label="Page Heading"
                      value={pageData.content?.title || ''}
                      onChange={(e) => updateContent('content.title', e.target.value)}
                    />
                    <Input
                      label="Subheading"
                      value={pageData.content?.subtitle || ''}
                      onChange={(e) => updateContent('content.subtitle', e.target.value)}
                    />
                  </div>
                  <div>
                    <ImageSelector
                      label="Page Banner Image"
                      value={pageData.content?.image || ''}
                      onChange={(value) => updateContent('content.image', value)}
                    />
                  </div>
                </div>
              </SectionBlock>
            )}

          </div>
        </div>
      </Container>
    </div>
  )
}

export default ContentEditor

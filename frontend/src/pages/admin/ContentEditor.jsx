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
  Eye,
  Heart,
  BookOpen,
  Palette,
  PaintBucket,
  Info,
  Sparkles,
  Trash2,
  TrendingUp,
  Target,
  Shield,
  Zap
} from 'lucide-react'
import Container from '../../components/common/Container'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import ImageSelector from '../../components/admin/ImageSelector'
import MultiImageSelector from '../../components/admin/MultiImageSelector'
import IconPicker from '../../components/admin/IconPicker' // Import IconPicker
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
        </div >
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


const StyleControlPanel = ({ title, description, sectionKey, values, onChange }) => (
  <div className="p-5 border border-neutral-200 rounded-xl bg-white mb-4">
    <div className="mb-4 border-b border-neutral-100 pb-2">
      <h4 className="font-semibold text-neutral-900 flex items-center gap-2">
        <div className="w-2 h-6 bg-primary-500 rounded-sm"></div>
        {title}
      </h4>
      {description && (
        <p className="text-sm text-neutral-500 mt-1 ml-4 flex items-start gap-1">
          <Info size={14} className="mt-1 shrink-0" />
          {description}
        </p>
      )}
    </div>
    <div className="grid md:grid-cols-3 gap-6">
      {/* Background */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Background</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={values?.bgColor || '#ffffff'}
            onChange={(e) => onChange('bgColor', e.target.value)}
            className="h-10 w-16 rounded cursor-pointer border-0 p-0 shadow-sm"
          />
          <div className="flex flex-col">
            <span className="text-xs text-neutral-400 font-mono">{values?.bgColor || '#ffffff'}</span>
            <span className="text-xs text-neutral-500">Section Color</span>
          </div>
        </div>
      </div>

      {/* Heading Typography */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Heading Text</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={values?.headingColor || '#171717'}
            onChange={(e) => onChange('headingColor', e.target.value)}
            className="h-10 w-16 rounded cursor-pointer border-0 p-0 shadow-sm"
          />
          <div className="flex flex-col">
            <span className="text-xs text-neutral-400 font-mono">{values?.headingColor || '#171717'}</span>
            <span className="text-xs text-neutral-500">Title Color</span>
          </div>
        </div>
      </div>

      {/* Body Typography */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Body Text</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={values?.textColor || '#525252'}
            onChange={(e) => onChange('textColor', e.target.value)}
            className="h-10 w-16 rounded cursor-pointer border-0 p-0 shadow-sm"
          />
          <div className="flex flex-col">
            <span className="text-xs text-neutral-400 font-mono">{values?.textColor || '#525252'}</span>
            <span className="text-xs text-neutral-500">Paragraphs</span>
          </div>
        </div>
      </div>
    </div>

    {/* Optional Card Styling */}
    {(values?.cardBgColor !== undefined) && (
      <div className="mt-6 pt-4 border-t border-dashed border-neutral-200">
        <h5 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">Card / Item Styling</h5>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-400">Card Background</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={values?.cardBgColor || '#ffffff'}
                onChange={(e) => onChange('cardBgColor', e.target.value)}
                className="h-8 w-12 rounded cursor-pointer border-0 p-0 shadow-sm"
              />
              <span className="text-xs text-neutral-400 font-mono">{values?.cardBgColor}</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-400">Card Heading</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={values?.cardHeadingColor || '#171717'}
                onChange={(e) => onChange('cardHeadingColor', e.target.value)}
                className="h-8 w-12 rounded cursor-pointer border-0 p-0 shadow-sm"
              />
              <span className="text-xs text-neutral-400 font-mono">{values?.cardHeadingColor}</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-400">Card Text</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={values?.cardTextColor || '#525252'}
                onChange={(e) => onChange('cardTextColor', e.target.value)}
                className="h-8 w-12 rounded cursor-pointer border-0 p-0 shadow-sm"
              />
              <span className="text-xs text-neutral-400 font-mono">{values?.cardTextColor}</span>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Optional Icon Styling */}
    {(values?.iconBgColor !== undefined) && (
      <div className="mt-6 pt-4 border-t border-dashed border-neutral-200">
        <h5 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">Icon Styling</h5>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-400">Icon Background</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={values?.iconBgColor || '#3b82f6'}
                onChange={(e) => onChange('iconBgColor', e.target.value)}
                className="h-8 w-12 rounded cursor-pointer border-0 p-0 shadow-sm"
              />
              <span className="text-xs text-neutral-400 font-mono">{values?.iconBgColor}</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-400">Icon Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={values?.iconColor || '#ffffff'}
                onChange={(e) => onChange('iconColor', e.target.value)}
                className="h-8 w-12 rounded cursor-pointer border-0 p-0 shadow-sm"
              />
              <span className="text-xs text-neutral-400 font-mono">{values?.iconColor}</span>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Optional Button Styling */}
    {(values?.buttonBgColor !== undefined) && (
      <div className="mt-6 pt-4 border-t border-dashed border-neutral-200">
        <h5 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">Button Styling</h5>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-400">Button Background</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={values?.buttonBgColor || '#ea580c'}
                onChange={(e) => onChange('buttonBgColor', e.target.value)}
                className="h-8 w-12 rounded cursor-pointer border-0 p-0 shadow-sm"
              />
              <span className="text-xs text-neutral-400 font-mono">{values?.buttonBgColor}</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-400">Button Text</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={values?.buttonTextColor || '#ffffff'}
                onChange={(e) => onChange('buttonTextColor', e.target.value)}
                className="h-8 w-12 rounded cursor-pointer border-0 p-0 shadow-sm"
              />
              <span className="text-xs text-neutral-400 font-mono">{values?.buttonTextColor}</span>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Optional Secondary Button Styling */}
    {(values?.secButtonBgColor !== undefined) && (
      <div className="mt-6 pt-4 border-t border-dashed border-neutral-200">
        <h5 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">Secondary Button</h5>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-400">Background / Border</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={values?.secButtonBgColor || 'transparent'}
                onChange={(e) => onChange('secButtonBgColor', e.target.value)}
                className="h-8 w-12 rounded cursor-pointer border-0 p-0 shadow-sm"
              />
              <span className="text-xs text-neutral-400 font-mono">{values?.secButtonBgColor}</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-400">Text Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={values?.secButtonTextColor || '#ffffff'}
                onChange={(e) => onChange('secButtonTextColor', e.target.value)}
                className="h-8 w-12 rounded cursor-pointer border-0 p-0 shadow-sm"
              />
              <span className="text-xs text-neutral-400 font-mono">{values?.secButtonTextColor}</span>
            </div>
          </div>
        </div>
      </div>
    )}
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
  const [editorMode, setEditorMode] = useState('content') // 'content' | 'design'

  useEffect(() => {
    if (pageId) fetchPageData()
  }, [pageId])

  const fetchPageData = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getPageContent(pageId)
      // Initialize services structure if missing
      if (pageId === 'services') {
        if (!response.data?.content?.personal) {
          response.data.content = {
            ...response.data.content,
            personal: { title: "Personal Courier Services", items: [] },
            commercial: { title: "Commercial Logistics", items: [] },
          }
        }
        // Ensure Hero exists so the editor block shows up
        if (!response.data.content.hero) {
          response.data.content.hero = {
            headline: "What We Deliver",
            subheadline: "From affectionate parcels to families abroad to critical commercial cargo, we handle it all with precision and care.",
            cta: "",
            ctaLink: ""
          }
        }
      }
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

          {/* Mode Switcher */}
          <div className="flex justify-center mb-8">
            <div className="bg-neutral-100 p-1 rounded-lg inline-flex">
              <button
                onClick={() => setEditorMode('content')}
                className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all ${editorMode === 'content'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
                  }`}
              >
                <LayoutTemplate size={16} />
                Edit Content
              </button>
              <button
                onClick={() => setEditorMode('design')}
                className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all ${editorMode === 'design'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
                  }`}
              >
                <Palette size={16} />
                Design & Styles
              </button>
            </div>
          </div>

          {/* === DESIGN MODE === */}
          {editorMode === 'design' && (
            <div className="space-y-8 animate-in fade-in duration-300">

              <div className="p-4 bg-primary-50 rounded-lg flex items-start gap-3 border border-primary-100">
                <div className="p-2 bg-white rounded-md text-primary-600 shadow-sm mt-1">
                  <PaintBucket size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-primary-900">Visual Style Editor</h3>
                  <p className="text-sm text-primary-700 mt-1">
                    Control the colors for each section independently. Changes apply immediately upon saving.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Hero Section */}
                <StyleControlPanel
                  title="Hero Section (Top Banner)"
                  description="The main top banner with the large title and background image."
                  sectionKey="hero"
                  values={pageData.styles?.hero}
                  onChange={(key, val) => updateContent(`styles.hero.${key}`, val)}
                />

                {/* Story Section */}
                {pageId === 'about' && (
                  <>
                    <StyleControlPanel
                      title="Our Journey / Story"
                      description="The text content below the hero describing 'Who We Are'."
                      sectionKey="story"
                      values={pageData.styles?.story}
                      onChange={(key, val) => updateContent(`styles.story.${key}`, val)}
                    />

                    <StyleControlPanel
                      title="Services Grid (Cards)"
                      description="The grid of cards showing supported shipment items (Food, Books, etc)."
                      sectionKey="services"
                      values={pageData.styles?.services}
                      onChange={(key, val) => updateContent(`styles.services.${key}`, val)}
                    />

                    <StyleControlPanel
                      title="Stats Strip"
                      description="The row of numbers (2010, Global Network, etc.) inside the Story section."
                      sectionKey="stats"
                      values={pageData.styles?.stats}
                      onChange={(key, val) => updateContent(`styles.stats.${key}`, val)}
                    />

                    <StyleControlPanel
                      title="Mission & Vision"
                      description="The section detailing mission statement and vision."
                      sectionKey="mission"
                      values={pageData.styles?.mission}
                      onChange={(key, val) => updateContent(`styles.mission.${key}`, val)}
                    />

                    <StyleControlPanel
                      title="Core Values (Cards)"
                      description="The small icons and text (Reliability, Global Reach...) inside 'Why Choose Us'."
                      sectionKey="values"
                      values={pageData.styles?.values}
                      onChange={(key, val) => updateContent(`styles.values.${key}`, val)}
                    />

                    <StyleControlPanel
                      title="consulting"
                      description="The featured colored box (usually blue/dark) promoting free consulting."
                      sectionKey="consulting"
                      values={pageData.styles?.consulting}
                      onChange={(key, val) => updateContent(`styles.consulting.${key}`, val)}
                    />

                    <StyleControlPanel
                      title="Why Choose Us"
                      description="The section highlighting core strengths (on the left side)."
                      sectionKey="why_choose_us"
                      values={pageData.styles?.why_choose_us}
                      onChange={(key, val) => updateContent(`styles.why_choose_us.${key}`, val)}
                    />

                    <StyleControlPanel
                      title="Call To Action (Footer)"
                      description="The final banner before the site footer asking users to 'Get a Quote'."
                      sectionKey="cta"
                      values={pageData.styles?.cta}
                      onChange={(key, val) => updateContent(`styles.cta.${key}`, val)}
                    />
                  </>
                )}

                {/* Generic Fallback for other pages if extended later */}
                {/* Home Page Specific Styles */}
                {pageId === 'home' && (
                  <>
                    <StyleControlPanel
                      title="How It Works"
                      description="The section with 3 steps (Drop, Choose, Delivery)."
                      sectionKey="how_it_works"
                      values={pageData.styles?.how_it_works}
                      onChange={(key, val) => updateContent(`styles.how_it_works.${key}`, val)}
                    />

                    <StyleControlPanel
                      title="Courier Partners"
                      description="The grid of partner logos (DHL, FedEx, etc)."
                      sectionKey="partners"
                      values={pageData.styles?.partners}
                      onChange={(key, val) => updateContent(`styles.partners.${key}`, val)}
                    />

                    <StyleControlPanel
                      title="Why Choose Us"
                      description="The features grid (Best Prices, Fast Delivery...)."
                      sectionKey="why_choose_us"
                      values={pageData.styles?.why_choose_us}
                      onChange={(key, val) => updateContent(`styles.why_choose_us.${key}`, val)}
                    />

                    <StyleControlPanel
                      title="Call To Action (Footer)"
                      description="The final banner 'Ready to Ship?'."
                      sectionKey="cta"
                      values={pageData.styles?.cta}
                      onChange={(key, val) => updateContent(`styles.cta.${key}`, val)}
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* === CONTENT MODE === */}
          {editorMode === 'content' && (
            <div className="space-y-6 animate-in fade-in duration-300">
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
                      placeholder="e.g. Best Courier Services - Eagle Logistics"
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

              {/* 3. Services Page Custom Editor */}
              {pageId === 'services' && (
                <>
                  {['personal', 'commercial'].map((tab) => (
                    <SectionBlock
                      key={tab}
                      title={`${tab.charAt(0).toUpperCase() + tab.slice(1)} Services`}
                      description={`Manage items in the ${tab} tab`}
                      icon={tab === 'personal' ? Heart : Globe} // Note: Icons need import
                      isOpen={activeSection === tab}
                      onToggle={() => toggleSection(tab)}
                    >
                      <div className="space-y-6">
                        {/* Tab Hero Image */}
                        <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                          <h4 className="text-sm font-medium text-neutral-900 mb-3">Tab Header Image</h4>
                          <ImageSelector
                            label={`Background for ${tab} tab`}
                            value={pageData.content?.[tab]?.heroImage || ''}
                            onChange={(val) => updateContent(`content.${tab}.heroImage`, val)}
                            helperText="High-quality image for the top banner (1920x600px)"
                          />
                        </div>

                        <Input
                          label="Tab Title"
                          value={pageData.content?.[tab]?.title || ''}
                          onChange={(e) => updateContent(`content.${tab}.title`, e.target.value)}
                        />

                        <div className="space-y-4">
                          <label className="block text-sm font-medium text-neutral-900">Service Items</label>
                          {/* We need to initialize defaults if they don't exist in the CMS yet. 
                             In a real app, we'd probably want to 'seed' this from the frontend defaults or have a proper schema.
                             For now, we'll iterate over what exists or show a message to 'Initialize' if empty */}

                          {(pageData.content?.[tab]?.items || []).length === 0 && (
                            <div className="p-4 bg-yellow-50 text-yellow-700 text-sm rounded-lg">
                              No items found. Run the site once to seed defaults or add items manually.
                              {/* Quick Hack: Button to seed defaults if needed could go here */}
                            </div>
                          )}

                          {(pageData.content?.[tab]?.items || []).map((item, idx) => (
                            <div key={idx} className="p-4 border border-neutral-200 rounded-lg bg-neutral-50/50">
                              <div className="flex gap-4">
                                <div className="w-24 flex-shrink-0">
                                  <ImageSelector
                                    value={item.image}
                                    onChange={(val) => updateContent(`content.${tab}.items.${idx}.image`, val)}
                                    compact
                                  />
                                </div>
                                <div className="flex-1 space-y-3">
                                  <Input
                                    placeholder="Service Title"
                                    value={item.title}
                                    onChange={(e) => updateContent(`content.${tab}.items.${idx}.title`, e.target.value)}
                                  />
                                  <Input
                                    placeholder="Highlight Badge (e.g. 'Express Delivery')"
                                    value={item.highlight}
                                    onChange={(e) => updateContent(`content.${tab}.items.${idx}.highlight`, e.target.value)}
                                  />
                                  <textarea
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm"
                                    rows="2"
                                    placeholder="Description"
                                    value={item.description}
                                    onChange={(e) => updateContent(`content.${tab}.items.${idx}.description`, e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </SectionBlock>
                  ))}
                </>
              )}

              {/* 2. About Page Specific Structure */}
              {pageId === 'about' && (
                <>
                  <SectionBlock
                    title="Hero Section"
                    description="Main banner and headline"
                    icon={Sparkles}
                    isOpen={activeSection === 'hero'}
                    onToggle={() => toggleSection('hero')}
                  >
                    <div className="space-y-6">
                      <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                        <h4 className="text-sm font-medium text-neutral-900 mb-3">Hero Background</h4>
                        <ImageSelector
                          label="Hero Background Image"
                          value={pageData.content?.hero?.image || ''}
                          onChange={(val) => updateContent('content.hero.image', val)}
                          helperText="High-quality banner (1920x800px)"
                        />
                      </div>

                      <Input
                        label="Headline"
                        value={pageData.content?.hero?.title || ''}
                        onChange={(e) => updateContent('content.hero.title', e.target.value)}
                      />
                      <Input
                        label="Subheadline"
                        value={pageData.content?.hero?.subtitle || ''}
                        onChange={(e) => updateContent('content.hero.subtitle', e.target.value)}
                      />
                    </div>
                  </SectionBlock>

                  <SectionBlock
                    title="The Story (Our Journey)"
                    description="Paragraphs about company history and background"
                    icon={BookOpen}
                    isOpen={activeSection === 'story'}
                    onToggle={() => toggleSection('story')}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-neutral-900">Paragraphs</label>
                        <button
                          onClick={() => {
                            const currentStory = pageData.content?.story || []
                            updateContent('content.story', [...currentStory, 'New paragraph...'])
                          }}
                          className="text-sm text-primary-600 font-medium hover:text-primary-700"
                        >
                          + Add Paragraph
                        </button>
                      </div>

                      {(!pageData.content?.story || pageData.content.story.length === 0) && (
                        <p className="text-sm text-neutral-500 italic">No content yet. Add a paragraph to start.</p>
                      )}

                      {(pageData.content?.story || []).map((para, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                          <textarea
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                            rows="3"
                            value={para}
                            onChange={(e) => {
                              const newStory = [...(pageData.content?.story || [])]
                              newStory[idx] = e.target.value
                              updateContent('content.story', newStory)
                            }}
                          />
                          <button
                            onClick={() => {
                              const newStory = [...(pageData.content?.story || [])]
                              newStory.splice(idx, 1)
                              updateContent('content.story', newStory)
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded"
                            title="Remove paragraph"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </SectionBlock>

                  {/* Services Editor */}
                  <SectionBlock
                    title="Services (Things We Send)"
                    description="Manage the 4 main service cards"
                    icon={LayoutTemplate}
                    isOpen={activeSection === 'services'}
                    onToggle={() => toggleSection('services')}
                  >
                    <div className="space-y-4">
                      {(pageData.content?.services || []).map((service, idx) => (
                        <div key={idx} className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                          <div className="font-medium text-neutral-900 mb-2">Service Card #{idx + 1}</div>
                          <div className="grid gap-3">
                            <Input
                              label="Title"
                              value={service.title}
                              onChange={(e) => {
                                const newServices = [...(pageData.content?.services || [])]
                                newServices[idx] = { ...service, title: e.target.value }
                                updateContent('content.services', newServices)
                              }}
                            />
                            <textarea
                              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                              rows="2"
                              value={service.desc}
                              onChange={(e) => {
                                const newServices = [...(pageData.content?.services || [])]
                                newServices[idx] = { ...service, desc: e.target.value }
                                updateContent('content.services', newServices)
                              }}
                              placeholder="Description"
                            />
                          </div>
                        </div>
                      ))}
                      <p className="text-xs text-neutral-500 mt-2">* Icons are currently managed in code. Titles and descriptions are editable here.</p>
                    </div>
                  </SectionBlock>

                  {/* Stats Editor */}
                  <SectionBlock
                    title="Stats Strip"
                    description="Key performance indicators"
                    icon={TrendingUp}
                    isOpen={activeSection === 'stats'}
                    onToggle={() => toggleSection('stats')}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      {(pageData.content?.stats || []).map((stat, idx) => (
                        <div key={idx} className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                          <Input
                            label="Number"
                            value={stat.number}
                            onChange={(e) => {
                              const newStats = [...(pageData.content?.stats || [])]
                              newStats[idx] = { ...stat, number: e.target.value }
                              updateContent('content.stats', newStats)
                            }}
                          />
                          <div className="mt-2">
                            <Input
                              label="Label"
                              value={stat.label}
                              onChange={(e) => {
                                const newStats = [...(pageData.content?.stats || [])]
                                newStats[idx] = { ...stat, label: e.target.value }
                                updateContent('content.stats', newStats)
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionBlock>

                  {/* Mission */}
                  <SectionBlock
                    title="Why Choose Us - Description"
                    description="The introductory text (Mission) for this section"
                    icon={Target}
                    isOpen={activeSection === 'mission'}
                    onToggle={() => toggleSection('mission')}
                  >
                    <textarea
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                      rows="3"
                      value={pageData.content?.mission || ''}
                      onChange={(e) => updateContent('content.mission', e.target.value)}
                    />
                  </SectionBlock>

                  {/* Values */}
                  <SectionBlock
                    title="Core Values"
                    description="Why Choose Us content"
                    icon={Shield}
                    isOpen={activeSection === 'values'}
                    onToggle={() => toggleSection('values')}
                  >
                    <div className="space-y-4">
                      {(pageData.content?.values || []).map((val, idx) => (
                        <div key={idx} className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                          <div className="grid gap-3">
                            <Input
                              label="Value Title"
                              value={val.title}
                              onChange={(e) => {
                                const newValues = [...(pageData.content?.values || [])]
                                newValues[idx] = { ...val, title: e.target.value }
                                updateContent('content.values', newValues)
                              }}
                            />
                            <textarea
                              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                              rows="2"
                              value={val.desc}
                              onChange={(e) => {
                                const newValues = [...(pageData.content?.values || [])]
                                newValues[idx] = { ...val, desc: e.target.value }
                                updateContent('content.values', newValues)
                              }}
                              placeholder="Description"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionBlock>

                  {/* Consulting */}
                  <SectionBlock
                    title="Consulting Block"
                    description="Highlighted consulting offer"
                    icon={Zap}
                    isOpen={activeSection === 'consulting'}
                    onToggle={() => toggleSection('consulting')}
                  >
                    <div className="space-y-4">
                      <Input
                        label="Title"
                        value={pageData.content?.consulting?.title || ''}
                        onChange={(e) => updateContent('content.consulting.title', e.target.value)}
                      />
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                        <textarea
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                          rows="3"
                          value={pageData.content?.consulting?.desc || ''}
                          onChange={(e) => updateContent('content.consulting.desc', e.target.value)}
                        />
                      </div>
                    </div>
                  </SectionBlock>

                  {/* Why Choose Us */}
                  <SectionBlock
                    title="Why Choose Us - Title"
                    description="Section Heading"
                    icon={CheckCircle2}
                    isOpen={activeSection === 'why_choose_us'}
                    onToggle={() => toggleSection('why_choose_us')}
                  >
                    <div className="mb-0">
                      <Input
                        value={pageData.content?.why_choose_us?.title || 'Why Choose Us'}
                        onChange={(e) => {
                          const current = pageData.content?.why_choose_us || { enabled: true, features: [] }
                          updateContent('content.why_choose_us', { ...current, title: e.target.value })
                        }}
                        className="font-semibold"
                        label="Section Heading Text"
                      />
                    </div>
                  </SectionBlock>
                </>
              )}

              {/* 4. Dynamic Sections (Home Specific) */}
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
                      {(pageData.content?.how_it_works?.steps || []).map((step, index) => (
                        <div key={index} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 group">

                          {/* Card Header: Index Check & Remove Button */}
                          <div className="flex items-center justify-between mb-3 border-b border-neutral-200 pb-2">
                            <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs">
                              {index + 1}
                            </div>
                            <button
                              onClick={() => {
                                const current = pageData.content?.how_it_works || { steps: [] }
                                const newSteps = [...(current.steps || [])]
                                newSteps.splice(index, 1)
                                updateContent('content.how_it_works', { ...current, steps: newSteps })
                              }}
                              className="text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                              title="Remove Step"
                            >
                              <Trash2 size={14} /> Remove
                            </button>
                          </div>

                          <div className="space-y-3">
                            {/* Icon Selector */}
                            <div className="mb-3">
                              <IconPicker
                                value={step.icon}
                                onChange={(newIcon) => {
                                  const current = pageData.content?.how_it_works || { steps: [] }
                                  const newSteps = [...(current.steps || [])]
                                  newSteps[index] = { ...step, icon: newIcon }
                                  updateContent('content.how_it_works', { ...current, steps: newSteps })
                                }}
                              />
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
                        </div>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const current = pageData.content?.how_it_works || { steps: [] }
                        const newSteps = [...(current.steps || []), { id: Date.now(), title: 'New Step', description: 'Step description' }]
                        updateContent('content.how_it_works', { ...current, steps: newSteps })
                      }}
                      className="mt-4 w-full border-dashed"
                    >
                      <Sparkles size={16} className="mr-2" />
                      Add New Step
                    </Button>
                  </SectionBlock>

                  {/* Courier Partners */}
                  <SectionBlock
                    title="Our Courier Partners"
                    description="Partners section heading and description"
                    icon={Globe}
                    isOpen={activeSection === 'partners'}
                    onToggle={() => toggleSection('partners')}
                  >
                    <div className="space-y-4">
                      {/* Visibility Toggle */}
                      <div className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg bg-neutral-50">
                        <span className="text-sm font-medium text-neutral-700">Show Section</span>
                        <button
                          onClick={() => {
                            const current = pageData.content?.partners || {}
                            updateContent('content.partners', { ...current, enabled: current.enabled === false ? true : false })
                          }}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${(pageData.content?.partners?.enabled !== false) ? 'bg-primary-600' : 'bg-neutral-300'}`}
                        >
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${(pageData.content?.partners?.enabled !== false) ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                      </div>
                      <Input
                        label="Section Title"
                        value={pageData.content?.partners?.title || 'Our Courier Partners'}
                        onChange={(e) => {
                          const current = pageData.content?.partners || {}
                          updateContent('content.partners', { ...current, title: e.target.value })
                        }}
                      />
                      <textarea
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-1 focus:ring-primary-500"
                        rows="3"
                        placeholder="Description..."
                        value={pageData.content?.partners?.desc || ''}
                        onChange={(e) => {
                          const current = pageData.content?.partners || {}
                          updateContent('content.partners', { ...current, desc: e.target.value })
                        }}
                      />
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
                      {(pageData.content?.why_choose_us?.features || []).map((feature, index) => (
                        <div key={index} className="p-4 border border-neutral-200 rounded-lg bg-neutral-50/50 group">

                          {/* Card Header: Icon & Remove */}
                          <div className="flex items-center justify-between mb-3 border-b border-neutral-200 pb-2">
                            <div className="mt-1 text-neutral-400">
                              <CheckCircle2 size={20} />
                            </div>
                            <button
                              onClick={() => {
                                const current = pageData.content?.why_choose_us || { features: [] }
                                const newFeatures = [...(current.features || [])]
                                newFeatures.splice(index, 1)
                                updateContent('content.why_choose_us', { ...current, features: newFeatures })
                              }}
                              className="text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                              title="Remove Feature"
                            >
                              <Trash2 size={14} /> Remove
                            </button>
                          </div>

                          <div className="mb-3">
                            <label className="block text-xs font-medium text-neutral-500 mb-1">Icon</label>
                            <IconPicker
                              value={feature.icon}
                              onChange={(newIcon) => {
                                const current = pageData.content?.why_choose_us || { features: [] }
                                const newFeatures = [...(current.features || [])]
                                newFeatures[index] = { ...feature, icon: newIcon }
                                updateContent('content.why_choose_us', { ...current, features: newFeatures })
                              }}
                            />
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
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

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const current = pageData.content?.why_choose_us || { features: [] }
                        const newFeatures = [...(current.features || []), { id: Date.now(), title: 'New Highlight', description: 'Feature description' }]
                        updateContent('content.why_choose_us', { ...current, features: newFeatures })
                      }}
                      className="mt-4 w-full border-dashed"
                    >
                      <Sparkles size={16} className="mr-2" />
                      Add New Feature
                    </Button>
                  </SectionBlock>

                  {/* Call To Action */}
                  <SectionBlock
                    title="Call To Action (Footer)"
                    description="Bottom banner 'Ready to Ship?'"
                    icon={Zap}
                    isOpen={activeSection === 'cta'}
                    onToggle={() => toggleSection('cta')}
                  >
                    <div className="space-y-4">
                      <Input
                        label="Title"
                        value={pageData.content?.cta?.title || ''}
                        onChange={(e) => {
                          const current = pageData.content?.cta || {}
                          updateContent('content.cta', { ...current, title: e.target.value })
                        }}
                      />
                      <textarea
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-1 focus:ring-primary-500"
                        rows="2"
                        placeholder="Subtitle / Description"
                        value={pageData.content?.cta?.subtitle || ''}
                        onChange={(e) => {
                          const current = pageData.content?.cta || {}
                          updateContent('content.cta', { ...current, subtitle: e.target.value })
                        }}
                      />
                      <Input
                        label="Button Text"
                        value={pageData.content?.cta?.buttonText || 'Get Started'}
                        onChange={(e) => {
                          const current = pageData.content?.cta || {}
                          updateContent('content.cta', { ...current, buttonText: e.target.value })
                        }}
                      />
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
          )}
        </div>
      </Container>
    </div>
  )
}

export default ContentEditor

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Edit,
  Trash2,
  Truck,
  X,
  Upload,
  Search,
  Filter,
  MoreVertical,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import Container from '../../components/common/Container'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import { adminAPI } from '../../services/api'

const CourierManager = () => {
  // --- State ---
  const [couriers, setCouriers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCourier, setEditingCourier] = useState(null)

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'active', 'inactive'

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    tracking_url: '',
    description: '',
    display_order: 0,
    active: true
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoInputRef = useRef(null)

  // --- Effects ---
  useEffect(() => {
    fetchCouriers()
  }, [])

  // --- Data Fetching ---
  const fetchCouriers = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getCouriers()
      setCouriers(response.data || [])
    } catch (error) {
      setError('Failed to load couriers')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // --- Filtering Logic ---
  const filteredCouriers = useMemo(() => {
    return couriers
      .filter(courier => {
        const matchesSearch = courier.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'all'
          ? true
          : statusFilter === 'active' ? courier.active : !courier.active
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
  }, [couriers, searchQuery, statusFilter])

  // --- Handlers ---
  const handleOpenModal = (courier = null) => {
    if (courier) {
      setEditingCourier(courier.id)
      setFormData({
        name: courier.name || '',
        logo: courier.logo || '',
        tracking_url: courier.tracking_url || '',
        description: courier.description || '',
        display_order: courier.display_order || 0,
        active: courier.active !== undefined ? courier.active : true
      })
      setLogoPreview(courier.logo ? `/uploads/${courier.logo}` : null)
    } else {
      setEditingCourier(null)
      setFormData({
        name: '',
        logo: '',
        tracking_url: '',
        description: '',
        display_order: 0,
        active: true
      })
      setLogoPreview(null)
    }
    setLogoFile(null)
    setShowModal(true)
    setError('')
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCourier(null)
    setLogoFile(null)
    setLogoPreview(null)
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, JPEG, GIF, WEBP)')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setLogoFile(file)
    setError('')

    const reader = new FileReader()
    reader.onloadend = () => setLogoPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      let logoFilename = formData.logo

      if (logoFile) {
        setUploadingLogo(true)
        try {
          const uploadResponse = await adminAPI.uploadMedia(logoFile)
          logoFilename = uploadResponse.data.filename || uploadResponse.data.path?.split('/').pop()
        } catch (uploadError) {
          setError(uploadError.response?.data?.detail || 'Failed to upload logo')
          setUploadingLogo(false)
          return
        }
        setUploadingLogo(false)
      }

      const courierData = {
        ...formData,
        logo: logoFilename
      }

      if (editingCourier) {
        await adminAPI.updateCourier(editingCourier, courierData)
        setSuccess('Courier updated successfully!')
      } else {
        await adminAPI.createCourier(courierData)
        setSuccess('Courier created successfully!')
      }

      setTimeout(() => setSuccess(''), 3000)
      fetchCouriers()
      handleCloseModal()
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to save courier')
      setUploadingLogo(false)
    }
  }

  const handleDelete = async (courierId, name) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return
    try {
      await adminAPI.deleteCourier(courierId)
      setSuccess('Courier deleted successfully!')
      fetchCouriers()
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to delete courier')
    }
  }

  // --- Render ---

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <Container>
        <div className="py-8 space-y-8">

          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Courier Partners</h1>
              <p className="text-neutral-500 mt-1">Manage shipping providers and tracking integration</p>
            </div>
            <Button
              onClick={() => handleOpenModal()}
              className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 border-0 rounded-xl px-6 py-2.5 flex items-center gap-2 transform transition-all hover:-translate-y-0.5"
            >
              <div className="bg-white/20 p-1 rounded-full backdrop-blur-sm">
                <Plus size={18} className="text-white" />
              </div>
              <span className="font-semibold">Add New Courier</span>
            </Button>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
              <input
                type="text"
                placeholder="Search couriers..."
                className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex bg-neutral-100 p-1 rounded-lg">
              {['all', 'active', 'inactive'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${statusFilter === status
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Messages */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3">
                  <AlertCircle size={20} />
                  {error}
                </div>
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl flex items-center gap-3">
                  <CheckCircle2 size={20} />
                  {success}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading State */}
          {loading && (
            <div className="py-20 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          )}

          {/* Grid Layout */}
          {!loading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode='popLayout'>
                {filteredCouriers.map((courier) => (
                  <motion.div
                    key={courier.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="group bg-white rounded-2xl border border-neutral-200 p-5 hover:shadow-xl hover:shadow-neutral-100/50 hover:border-primary-100 transition-all duration-300 relative overflow-hidden">
                      {/* Active Status Dot */}
                      <div className={`absolute top-4 right-4 w-2.5 h-2.5 rounded-full ${courier.active ? 'bg-green-500' : 'bg-neutral-300'}`} />

                      {/* Header */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-xl bg-neutral-50 border border-neutral-100 p-2 flex items-center justify-center">
                          {courier.logo ? (
                            <img src={`/uploads/${courier.logo}`} alt={courier.name} className="w-full h-full object-contain" />
                          ) : (
                            <Truck className="text-neutral-300" size={32} />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-neutral-900 leading-tight">{courier.name}</h3>
                          <span className={`inline-flex items-center text-xs font-medium mt-1 px-2 py-0.5 rounded-full ${courier.active ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-600'
                            }`}>
                            {courier.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-2 mb-6">
                        <p className="text-sm text-neutral-600 line-clamp-2 min-h-[2.5rem]">
                          {courier.description || <span className="text-neutral-400 italic">No description provided</span>}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono bg-neutral-50 p-2 rounded-lg truncate">
                          <span className="flex-shrink-0 text-neutral-500 font-sans font-medium">Link:</span>
                          <span className="truncate">{courier.tracking_url}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-4 border-t border-neutral-100">
                        <button
                          onClick={() => handleOpenModal(courier)}
                          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                        >
                          <Edit size={16} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(courier.id, courier.name)}
                          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {!loading && filteredCouriers.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-neutral-200">
              <Truck className="mx-auto text-neutral-300 mb-4" size={48} />
              <p className="text-lg font-medium text-neutral-900">No couriers found</p>
              <p className="text-neutral-500">Try adjusting your search or add a new courier.</p>
              <Button onClick={() => handleOpenModal()} className="mt-6" variant="outline">
                Add Courier
              </Button>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="sticky top-0 bg-white border-b border-neutral-100 p-6 flex justify-between items-center z-10">
                <h2 className="text-xl font-bold text-neutral-900">
                  {editingCourier ? 'Edit Courier' : 'Add New Courier'}
                </h2>
                <button onClick={handleCloseModal} className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-500">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex gap-6 flex-col md:flex-row">
                    {/* Logo Section */}
                    <div className="w-full md:w-1/3 space-y-3">
                      <label className="block text-sm font-medium text-neutral-700">Courier Logo</label>
                      <div
                        className="border-2 border-dashed border-neutral-200 rounded-xl p-4 flex flex-col items-center justify-center gap-3 text-center hover:border-primary-500 hover:bg-primary-50/50 transition-colors cursor-pointer aspect-square bg-neutral-50"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        {logoPreview ? (
                          <img src={logoPreview} alt="Preview" className="w-full h-full object-contain" />
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-primary-500">
                              <Upload size={20} />
                            </div>
                            <span className="text-xs text-neutral-500">Click to upload</span>
                          </>
                        )}
                      </div>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoSelect}
                      />
                      {formData.logo && (
                        <div className="text-xs text-center text-neutral-400 font-mono truncate px-2">
                          {formData.logo}
                        </div>
                      )}
                    </div>

                    {/* inputs */}
                    <div className="flex-1 space-y-4">
                      <Input
                        label="Courier Name"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="e.g. FedEx"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Display Order"
                          type="number"
                          value={formData.display_order}
                          onChange={e => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                        />
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">Status</label>
                          <div className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg">
                            <span className={`w-2.5 h-2.5 rounded-full ${formData.active ? 'bg-green-500' : 'bg-neutral-300'}`} />
                            <span className="text-sm text-neutral-600 flex-1">{formData.active ? 'Active' : 'Hidden'}</span>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, active: !formData.active })}
                              className={`w-10 h-6 rounded-full relative transition-colors ${formData.active ? 'bg-primary-600' : 'bg-neutral-200'}`}
                            >
                              <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.active ? 'translate-x-4' : ''}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-neutral-700">Description</label>
                      <textarea
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm min-h-[80px]"
                        placeholder="Short description for the user..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Input
                        label="Tracking URL Template"
                        value={formData.tracking_url}
                        onChange={e => setFormData({ ...formData, tracking_url: e.target.value })}
                        required
                        placeholder="https://track.example.com?id={id}"
                        helperText="Use {id} as the placeholder for the tracking number"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-neutral-100">
                    <Button type="button" variant="ghost" onClick={handleCloseModal} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" className="flex-1" disabled={uploadingLogo}>
                      {uploadingLogo ? 'Uploading...' : (editingCourier ? 'Save Changes' : 'Create Courier')}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

      </Container>
    </div>
  )
}

export default CourierManager

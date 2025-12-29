import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Truck, X, Upload, Image as ImageIcon } from 'lucide-react'
import Container from '../../components/common/Container'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import { adminAPI } from '../../services/api'

const CourierManager = () => {
  const [couriers, setCouriers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCourier, setEditingCourier] = useState(null)
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

  useEffect(() => {
    fetchCouriers()
  }, [])

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
      // Set preview if logo exists
      if (courier.logo) {
        setLogoPreview(`/uploads/${courier.logo}`)
      } else {
        setLogoPreview(null)
      }
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
    setFormData({
      name: '',
      logo: '',
      tracking_url: '',
      description: '',
      display_order: 0,
      active: true
    })
    setLogoFile(null)
    setLogoPreview(null)
    if (logoInputRef.current) {
      logoInputRef.current.value = ''
    }
  }

  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, JPEG, GIF, WEBP)')
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setLogoFile(file)
    setError('')

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      let logoFilename = formData.logo

      // Upload logo file if a new one is selected
      if (logoFile) {
        setUploadingLogo(true)
        try {
          const uploadResponse = await adminAPI.uploadMedia(logoFile)
          console.log('Upload response:', uploadResponse.data) // Debug log
          // Backend returns { filename: "...", path: "..." }
          logoFilename = uploadResponse.data.filename || uploadResponse.data.path?.split('/').pop()
          if (!logoFilename) {
            throw new Error('Failed to get filename from upload response')
          }
          console.log('Logo filename:', logoFilename) // Debug log
        } catch (uploadError) {
          console.error('Upload error:', uploadError) // Debug log
          setError(uploadError.response?.data?.detail || uploadError.message || 'Failed to upload logo')
          setUploadingLogo(false)
          return
        }
        setUploadingLogo(false)
      }

      // Prepare courier data - always include logo field explicitly
      const courierData = {
        name: formData.name,
        tracking_url: formData.tracking_url,
        description: formData.description || null,
        display_order: formData.display_order,
        active: formData.active,
        logo: logoFilename || formData.logo || null  // Always include logo field
      }

      console.log('Saving courier with data:', courierData) // Debug log
      console.log('Logo filename:', logoFilename) // Debug log
      console.log('FormData logo:', formData.logo) // Debug log
      console.log('Logo file:', logoFile) // Debug log

      if (editingCourier) {
        const response = await adminAPI.updateCourier(editingCourier, courierData)
        console.log('Update response:', response.data) // Debug log
        setSuccess('Courier updated successfully!')
      } else {
        const response = await adminAPI.createCourier(courierData)
        console.log('Create response:', response.data) // Debug log
        setSuccess('Courier created successfully!')
      }
      setTimeout(() => setSuccess(''), 3000)
      fetchCouriers()
      handleCloseModal()
    } catch (error) {
      console.error('Save error:', error) // Debug log
      setError(error.response?.data?.detail || error.message || 'Failed to save courier')
      setUploadingLogo(false)
    }
  }

  const handleDelete = async (courierId, name) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) {
      return
    }

    try {
      await adminAPI.deleteCourier(courierId)
      setSuccess('Courier deleted successfully!')
      setTimeout(() => setSuccess(''), 3000)
      fetchCouriers()
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to delete courier')
    }
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

  return (
    <Container>
      <div className="py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-h1">Courier Manager</h1>
            <p className="text-neutral-600 mt-1">Manage courier partners</p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus size={20} className="mr-2" />
            Add Courier
          </Button>
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

        {/* Couriers List */}
        {couriers.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {couriers.map((courier) => (
              <motion.div
                key={courier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {courier.logo ? (
                        <img
                          src={`/uploads/${courier.logo}`}
                          alt={courier.name}
                          className="w-12 h-12 object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <div className={`w-12 h-12 rounded-lg gradient-bg flex items-center justify-center ${courier.logo ? 'hidden' : 'flex'}`}>
                        <Truck className="text-white" size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900">{courier.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          courier.active 
                            ? 'bg-success-100 text-success-700' 
                            : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          {courier.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {courier.description && (
                    <p className="text-sm text-neutral-600 mb-4">{courier.description}</p>
                  )}

                  <div className="text-xs text-neutral-500 mb-4">
                    <p>Tracking URL: {courier.tracking_url?.substring(0, 40)}...</p>
                    <p>Order: {courier.display_order}</p>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenModal(courier)}
                      className="flex-1"
                    >
                      <Edit size={16} className="mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(courier.id, courier.name)}
                      className="flex-1 text-error-500 border-error-500 hover:bg-error-50"
                    >
                      <Trash2 size={16} className="mr-1" />
                      Delete
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <Truck className="mx-auto text-neutral-300 mb-4" size={48} />
              <p className="text-neutral-600">No couriers added yet</p>
              <Button onClick={() => handleOpenModal()} className="mt-4">
                <Plus size={20} className="mr-2" />
                Add First Courier
              </Button>
            </div>
          </Card>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <Card padding="lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-h3">
                    {editingCourier ? 'Edit Courier' : 'Add New Courier'}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Courier Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />

                  {/* Logo Upload Section */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Logo
                    </label>
                    
                    {/* Logo Preview */}
                    {(logoPreview || formData.logo) && (
                      <div className="mb-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-neutral-700">Current Logo:</span>
                          {logoFile && (
                            <span className="text-xs text-primary-600">New file selected</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4">
                          <img
                            src={logoPreview || `/uploads/${formData.logo}`}
                            alt="Logo preview"
                            className="w-24 h-24 object-contain bg-white rounded border border-neutral-200 p-2"
                            onError={(e) => {
                              e.target.style.display = 'none'
                            }}
                          />
                          {formData.logo && !logoFile && (
                            <div className="flex-1">
                              <p className="text-sm text-neutral-600">Filename: {formData.logo}</p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setFormData({ ...formData, logo: '' })
                                  setLogoPreview(null)
                                }}
                                className="mt-2"
                              >
                                Remove Logo
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Upload Button */}
                    <div className="relative">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoSelect}
                        className="hidden"
                        disabled={uploadingLogo}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="w-full"
                      >
                        {uploadingLogo ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500 mr-2"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload size={18} className="mr-2" />
                            {logoFile ? 'Change Logo' : (formData.logo ? 'Replace Logo' : 'Upload Logo')}
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-neutral-500 mt-2">
                        Supported: PNG, JPG, JPEG, GIF, WEBP (Max 10MB)
                      </p>
                    </div>
                  </div>

                  <Input
                    label="Tracking URL Template"
                    value={formData.tracking_url}
                    onChange={(e) => setFormData({ ...formData, tracking_url: e.target.value })}
                    placeholder="https://example.com/track/{id}"
                    required
                    helperText="Use {id} as placeholder for tracking number"
                  />

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Description
                    </label>
                    <textarea
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <Input
                    label="Display Order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    helperText="Lower numbers appear first"
                  />

                  <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                    <div>
                      <p className="font-medium text-neutral-900">Active</p>
                      <p className="text-sm text-neutral-600">Show on website</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, active: !formData.active })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.active ? 'bg-primary-500' : 'bg-neutral-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.active ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleCloseModal}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      className="flex-1"
                      disabled={uploadingLogo}
                    >
                      {uploadingLogo ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        editingCourier ? 'Update Courier' : 'Create Courier'
                      )}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
    </Container>
  )
}

export default CourierManager


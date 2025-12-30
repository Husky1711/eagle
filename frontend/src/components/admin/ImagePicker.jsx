import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Upload, Image as ImageIcon, Check, Loader2 } from 'lucide-react'
import { adminAPI } from '../../services/api'
import Button from '../common/Button'
import Card from '../common/Card'

const ImagePicker = ({ isOpen, onClose, onSelect, currentImage = '' }) => {
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (isOpen) {
      fetchMedia()
    }
  }, [isOpen])

  const fetchMedia = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await adminAPI.getMedia()
      setMedia(response.data || [])
    } catch (error) {
      setError('Failed to load media files')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    setUploading(true)
    setError('')

    try {
      const response = await adminAPI.uploadMedia(file)
      await fetchMedia() // Refresh list
      // Auto-select the newly uploaded image
      onSelect(response.data.filename)
      onClose()
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to upload file')
    } finally {
      setUploading(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const getImageUrl = (filename) => {
    return `http://localhost:8000/uploads/${filename}`
  }

  const filteredMedia = media.filter((file) =>
    file.original_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelect = (filename) => {
    onSelect(filename)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <div>
              <h2 className="text-h3">Select Image</h2>
              <p className="text-sm text-neutral-600 mt-1">
                Choose an image or upload a new one
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Search and Upload Bar */}
          <div className="p-4 border-b border-neutral-200 flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
              <input
                type="text"
                placeholder="Search images..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
                id="image-upload-input"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => document.getElementById('image-upload-input')?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={18} />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={18} className="mr-2" />
                    Upload New
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-4 mt-4 bg-error-50 border border-error-200 text-error-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-primary-500" size={32} />
              </div>
            ) : filteredMedia.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <ImageIcon className="mx-auto text-neutral-300 mb-4" size={48} />
                  <p className="text-neutral-600 mb-2">
                    {searchQuery ? 'No images found' : 'No images uploaded yet'}
                  </p>
                  {!searchQuery && (
                    <div className="mt-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUpload}
                        disabled={uploading}
                        className="hidden"
                        id="empty-upload-input"
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => document.getElementById('empty-upload-input')?.click()}
                        disabled={uploading}
                      >
                        <Upload size={18} className="mr-2" />
                        Upload Your First Image
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredMedia.map((file) => {
                  const isSelected = currentImage === file.filename
                  return (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group cursor-pointer"
                      onClick={() => handleSelect(file.filename)}
                    >
                      <Card padding="none" className="overflow-hidden">
                        <div className="aspect-square bg-neutral-100 relative">
                          <img
                            src={getImageUrl(file.filename)}
                            alt={file.original_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23e5e7eb"/><text x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af">Image</text></svg>'
                            }}
                          />
                          {/* Selected Indicator */}
                          {isSelected && (
                            <div className="absolute inset-0 bg-primary-500 bg-opacity-20 border-2 border-primary-500 flex items-center justify-center">
                              <div className="bg-primary-500 text-white rounded-full p-2">
                                <Check size={24} />
                              </div>
                            </div>
                          )}
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Button variant="secondary" size="sm">
                              Select
                            </Button>
                          </div>
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-medium text-neutral-900 truncate" title={file.original_name}>
                            {file.original_name}
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">
                            {new Date(file.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-200 flex items-center justify-between">
            <p className="text-sm text-neutral-600">
              {filteredMedia.length} image{filteredMedia.length !== 1 ? 's' : ''} found
            </p>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>

          {/* Preview Modal */}
          {preview && (
            <div
              className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-60 p-4"
              onClick={() => setPreview(null)}
            >
              <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setPreview(null)}
                  className="absolute -top-10 right-0 text-white hover:text-neutral-300"
                >
                  <X size={32} />
                </button>
                <img
                  src={getImageUrl(preview.filename)}
                  alt={preview.original_name}
                  className="max-w-full max-h-[90vh] rounded-lg"
                />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default ImagePicker


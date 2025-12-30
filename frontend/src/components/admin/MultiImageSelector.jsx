import { useState } from 'react'
import { motion } from 'framer-motion'
import { Image as ImageIcon, X, Upload, Loader2, Plus } from 'lucide-react'
import Button from '../common/Button'
import ImagePicker from './ImagePicker'
import { adminAPI } from '../../services/api'

const MultiImageSelector = ({ value = [], onChange, label, helperText, maxImages = 10 }) => {
  const [showPicker, setShowPicker] = useState(false)
  const [uploading, setUploading] = useState(false)

  const getImageUrl = (filename) => {
    if (!filename) return null
    return `http://localhost:8000/uploads/${filename}`
  }

  const handleQuickUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    if (value.length + files.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed. You can add ${maxImages - value.length} more.`)
      return
    }

    setUploading(true)

    try {
      const newImages = []
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          alert('Please select only image files')
          continue
        }
        const response = await adminAPI.uploadMedia(file)
        newImages.push(response.data.filename)
      }
      onChange([...value, ...newImages])
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to upload images')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleRemove = (index) => {
    const newImages = value.filter((_, i) => i !== index)
    onChange(newImages)
  }

  const handleSelect = (filename) => {
    if (value.length >= maxImages) {
      alert(`Maximum ${maxImages} images allowed. Please remove an image first.`)
      return
    }
    if (value.includes(filename)) {
      alert('This image is already added')
      return
    }
    onChange([...value, filename])
    setShowPicker(false)
  }

  const handleReorder = (fromIndex, toIndex) => {
    const newImages = [...value]
    const [removed] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, removed)
    onChange(newImages)
  }

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {label}
          {value.length > 0 && (
            <span className="text-xs text-neutral-500 ml-2">
              ({value.length} image{value.length !== 1 ? 's' : ''})
            </span>
          )}
        </label>
      )}

      {value.length > 0 ? (
        <div className="space-y-4">
          {/* Image Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {value.map((filename, index) => {
              const imageUrl = getImageUrl(filename)
              return (
                <motion.div
                  key={`${filename}-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group"
                >
                  <div className="border-2 border-neutral-200 rounded-lg overflow-hidden bg-neutral-50">
                    <img
                      src={imageUrl}
                      alt={`Image ${index + 1}`}
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                    <div className="hidden w-full h-32 items-center justify-center bg-neutral-100">
                      <div className="text-center">
                        <ImageIcon className="mx-auto text-neutral-400 mb-2" size={24} />
                        <p className="text-xs text-neutral-500">Image not found</p>
                      </div>
                    </div>
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleRemove(index)}
                          className="bg-error-500 hover:bg-error-600 text-white"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Image Number Badge */}
                    <div className="absolute top-2 left-2 bg-primary-500 text-white text-xs font-semibold px-2 py-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                  
                  {/* Reorder Buttons */}
                  {value.length > 1 && (
                    <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {index > 0 && (
                        <button
                          onClick={() => handleReorder(index, index - 1)}
                          className="bg-white/90 hover:bg-white p-1 rounded text-xs"
                          title="Move up"
                        >
                          ↑
                        </button>
                      )}
                      {index < value.length - 1 && (
                        <button
                          onClick={() => handleReorder(index, index + 1)}
                          className="bg-white/90 hover:bg-white p-1 rounded text-xs"
                          title="Move down"
                        >
                          ↓
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Add More Button */}
          {value.length < maxImages && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPicker(true)}
              >
                <Plus size={18} className="mr-2" />
                Add More Images
              </Button>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleQuickUpload}
                  disabled={uploading}
                  className="hidden"
                  id={`multi-upload-${label?.replace(/\s+/g, '-')}`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById(`multi-upload-${label?.replace(/\s+/g, '-')}`)?.click()}
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
          )}
        </div>
      ) : (
        <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center bg-neutral-50 hover:bg-neutral-100 transition-colors">
          <ImageIcon className="mx-auto text-neutral-400 mb-4" size={48} />
          <p className="text-sm text-neutral-600 mb-4">No images selected</p>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowPicker(true)}
            >
              <ImageIcon size={18} className="mr-2" />
              Select Images
            </Button>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleQuickUpload}
                disabled={uploading}
                className="hidden"
                id={`multi-upload-empty-${label?.replace(/\s+/g, '-')}`}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById(`multi-upload-empty-${label?.replace(/\s+/g, '-')}`)?.click()}
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
        </div>
      )}

      {helperText && (
        <p className="text-xs text-neutral-500 mt-2">{helperText}</p>
      )}

      {/* Image Picker Modal */}
      <ImagePicker
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handleSelect}
      />
    </div>
  )
}

export default MultiImageSelector


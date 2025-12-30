import { useState } from 'react'
import { motion } from 'framer-motion'
import { Image as ImageIcon, X, Upload, Loader2 } from 'lucide-react'
import Button from '../common/Button'
import ImagePicker from './ImagePicker'
import { adminAPI } from '../../services/api'

const ImageSelector = ({ value, onChange, label, helperText }) => {
  const [showPicker, setShowPicker] = useState(false)
  const [uploading, setUploading] = useState(false)

  const getImageUrl = (filename) => {
    if (!filename) return null
    return `http://localhost:8000/uploads/${filename}`
  }

  const handleQuickUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    setUploading(true)

    try {
      const response = await adminAPI.uploadMedia(file)
      onChange(response.data.filename)
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to upload image')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleRemove = () => {
    onChange('')
  }

  const imageUrl = getImageUrl(value)

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {label}
        </label>
      )}

      {imageUrl ? (
        <div className="relative">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative group"
          >
            <div className="border-2 border-neutral-200 rounded-lg overflow-hidden bg-neutral-50">
              <img
                src={imageUrl}
                alt="Selected"
                className="w-full h-48 object-cover"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
              <div className="hidden w-full h-48 items-center justify-center bg-neutral-100">
                <div className="text-center">
                  <ImageIcon className="mx-auto text-neutral-400 mb-2" size={32} />
                  <p className="text-sm text-neutral-500">Image not found</p>
                </div>
              </div>
            </div>
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-lg">
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowPicker(true)}
                >
                  Change
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRemove}
                  className="bg-error-500 hover:bg-error-600 text-white"
                >
                  <X size={16} className="mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          </motion.div>
          
          {value && (
            <p className="text-xs text-neutral-500 mt-2 truncate" title={value}>
              {value}
            </p>
          )}
        </div>
      ) : (
        <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center bg-neutral-50 hover:bg-neutral-100 transition-colors">
          <ImageIcon className="mx-auto text-neutral-400 mb-4" size={48} />
          <p className="text-sm text-neutral-600 mb-4">No image selected</p>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowPicker(true)}
            >
              <ImageIcon size={18} className="mr-2" />
              Select Image
            </Button>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleQuickUpload}
                disabled={uploading}
                className="hidden"
                id={`quick-upload-${label?.replace(/\s+/g, '-')}`}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById(`quick-upload-${label?.replace(/\s+/g, '-')}`)?.click()}
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

      {helperText && !value && (
        <p className="text-xs text-neutral-500 mt-2">{helperText}</p>
      )}

      {/* Image Picker Modal */}
      <ImagePicker
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={onChange}
        currentImage={value}
      />
    </div>
  )
}

export default ImageSelector


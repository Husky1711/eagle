import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, Trash2, Image as ImageIcon, X } from 'lucide-react'
import Container from '../../components/common/Container'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import { adminAPI } from '../../services/api'

const MediaManager = () => {
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    fetchMedia()
  }, [])

  const fetchMedia = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getMedia()
      setMedia(response.data || [])
    } catch (error) {
      setError('Failed to load media files')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fileInputRef = useRef(null)
  const [isDragActive, setIsDragActive] = useState(false)

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          setError('Please select only image files')
          setUploading(false)
          return
        }
        await adminAPI.uploadMedia(file)
      }
      setSuccess(`${files.length} file(s) uploaded successfully!`)
      setTimeout(() => setSuccess(''), 3000)
      fetchMedia()
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragActive(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragActive(false)
    const files = Array.from(e.dataTransfer.files || [])
    if (files.length > 0) {
      const event = { target: { files } }
      handleFileSelect(event)
    }
  }

  const handleDelete = async (fileId, filename) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) {
      return
    }

    try {
      await adminAPI.deleteMedia(fileId)
      setSuccess('File deleted successfully!')
      setTimeout(() => setSuccess(''), 3000)
      fetchMedia()
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to delete file')
    }
  }

  const getImageUrl = (filename) => {
    return `http://localhost:8000/uploads/${filename}`
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
            <h1 className="text-h1">Media Manager</h1>
            <p className="text-neutral-600 mt-1">Upload and manage images</p>
          </div>
          <div className="text-sm text-neutral-600">
            {media.length} file(s) total
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

        {/* Upload Area */}
        <Card className="mb-8">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
              transition-all duration-200
              ${isDragActive 
                ? 'border-primary-500 bg-primary-50' 
                : 'border-neutral-300 hover:border-primary-400 hover:bg-neutral-50'
              }
              ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
            <Upload className="mx-auto text-neutral-400 mb-4" size={48} />
            {uploading ? (
              <p className="text-neutral-600">Uploading...</p>
            ) : isDragActive ? (
              <p className="text-primary-600 font-medium">Drop files here...</p>
            ) : (
              <>
                <p className="text-neutral-700 font-medium mb-2">
                  Drag & drop images here, or click to select
                </p>
                <p className="text-sm text-neutral-500">
                  Supports: PNG, JPG, JPEG, GIF, WEBP (Max 10MB)
                </p>
              </>
            )}
          </div>
        </Card>

        {/* Media Grid */}
        {media.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {media.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group"
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
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setPreview(file)}
                          className="p-2 bg-white rounded-lg hover:bg-neutral-100 transition-colors"
                          title="Preview"
                        >
                          <ImageIcon size={20} className="text-neutral-700" />
                        </button>
                        <button
                          onClick={() => handleDelete(file.id, file.original_name)}
                          className="p-2 bg-error-500 text-white rounded-lg hover:bg-error-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-neutral-900 truncate" title={file.original_name}>
                      {file.original_name}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {new Date(file.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <ImageIcon className="mx-auto text-neutral-300 mb-4" size={48} />
              <p className="text-neutral-600">No media files uploaded yet</p>
              <p className="text-sm text-neutral-500 mt-2">
                Drag and drop images above to get started
              </p>
            </div>
          </Card>
        )}

        {/* Preview Modal */}
        {preview && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
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
              <div className="mt-4 text-white text-center">
                <p className="font-medium">{preview.original_name}</p>
                <p className="text-sm text-neutral-300 mt-1">
                  Uploaded: {new Date(preview.uploaded_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Container>
  )
}

export default MediaManager


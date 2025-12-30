import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  Trash2,
  Image as ImageIcon,
  X,
  Search,
  Link as LinkIcon,
  Check,
  Download,
  Filter,
  MoreVertical,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
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
  const [imageErrors, setImageErrors] = useState(new Set()) // Track failed images

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  const fileInputRef = useRef(null)
  const [isDragActive, setIsDragActive] = useState(false)

  useEffect(() => {
    fetchMedia()
  }, [])

  const fetchMedia = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getMedia()
      setMedia(response.data || [])
      setImageErrors(new Set()) // Reset errors on new fetch
    } catch (error) {
      setError('Failed to load media library')
      console.error('Media fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMedia = useMemo(() => {
    return media.filter(file =>
      file.original_name.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at))
  }, [media, searchQuery])

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          setError('Only image files are supported')
          setUploading(false)
          return
        }
        await adminAPI.uploadMedia(file)
      }
      setSuccess(`${files.length} image(s) uploaded`)
      setTimeout(() => setSuccess(''), 3000)
      fetchMedia()
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      setError(error.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (fileId, filename) => {
    if (!confirm(`Delete ${filename}? This action cannot be undone.`)) return

    try {
      await adminAPI.deleteMedia(fileId)
      setSuccess('Image deleted')
      setTimeout(() => setSuccess(''), 3000)
      fetchMedia()
      if (preview?.id === fileId) setPreview(null)
    } catch (error) {
      setError('Failed to delete image')
    }
  }

  const getImageUrl = (filename, useDirectUrl = false) => {
    // Handle edge cases: null, undefined, empty string
    if (!filename || typeof filename !== 'string' || filename.trim() === '') {
      console.warn('Invalid filename provided to getImageUrl:', filename)
      return '' // Return empty string to trigger onError
    }
    
    // Clean filename - remove any path separators that might be in the filename
    const cleanFilename = filename.trim().replace(/^.*[\\\/]/, '')
    
    // DON'T encode UUIDs - they're already URL-safe (hyphens are fine in URLs)
    // FastAPI path parameters handle URL encoding/decoding automatically
    // Only encode if there are spaces or other truly problematic characters
    // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (hyphens are safe, don't encode!)
    const finalFilename = cleanFilename
    
    // Use direct backend URL if proxy fails, otherwise use proxy
    if (useDirectUrl) {
      return `http://localhost:8000/api/public/uploads/${finalFilename}`
    }
    
    // Use API endpoint through Vite proxy
    return `/api/public/uploads/${finalFilename}`
  }

  const copyToClipboard = (url, id) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Drag & Drop Handlers
  const handleDrag = (e) => {
    e.preventDefault()
    setIsDragActive(e.type === 'dragover')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragActive(false)
    const files = Array.from(e.dataTransfer.files || [])
    if (files.length > 0) handleFileSelect({ target: { files } })
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <Container>
        <div className="py-8 space-y-8">

          {/* Header & Upload Controls */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Media Library</h1>
                  <p className="text-neutral-500 mt-1">Manage digital assets for your content</p>
                </div>
              </div>

              {/* Gallery Toolbar */}
              <div className="flex gap-4 p-1 bg-white rounded-xl border border-neutral-200 shadow-sm">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search images..."
                    className="w-full pl-10 pr-4 py-2.5 bg-transparent border-none focus:ring-0 text-neutral-900 placeholder-neutral-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="h-auto w-px bg-neutral-200 my-2" />
                <div className="flex items-center px-4 text-sm text-neutral-500 font-medium">
                  {filteredMedia.length} Assets
                </div>
              </div>

              {/* Feedback */}
              <AnimatePresence>
                {(error || success) && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <div className={`px-4 py-3 rounded-xl flex items-center gap-3 ${error ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
                      {error ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                      {error || success}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Loading */}
              {loading && (
                <div className="py-20 flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
              )}

              {/* Grid */}
              {!loading && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <AnimatePresence mode='popLayout'>
                    {filteredMedia.map((file) => {
                      const hasError = imageErrors.has(file.id)
                      // If proxy failed, use direct backend URL as fallback
                      // Don't encode UUIDs - hyphens are URL-safe, FastAPI handles encoding
                      const cleanFilename = file.filename.trim().replace(/^.*[\\\/]/, '')
                      const imageUrl = hasError 
                        ? `http://localhost:8000/api/public/uploads/${cleanFilename}`
                        : getImageUrl(file.filename)
                      const isValidUrl = imageUrl && imageUrl.trim() !== ''
                      
                      return (
                        <motion.div
                          key={file.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="group relative aspect-square bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
                        >
                          {isValidUrl ? (
                            <img
                              key={`img-${file.id}-${hasError ? 'direct' : 'proxy'}`}
                              src={imageUrl}
                              alt={file.original_name || 'Media file'}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              onClick={() => setPreview(file)}
                              onError={(e) => {
                                // Check if image actually failed or if it's just loading
                                // Sometimes onError fires prematurely during React re-renders
                                const img = e.target
                                
                                // If image has dimensions, it might have loaded
                                if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                                  return // Image actually loaded, ignore error
                                }
                                
                                const errorDetails = {
                                  fileId: file.id,
                                  filename: file.filename,
                                  url: imageUrl,
                                  isDirectUrl: hasError,
                                  error: img.error?.message || 'Unknown error',
                                  naturalWidth: img.naturalWidth,
                                  naturalHeight: img.naturalHeight,
                                  complete: img.complete,
                                  src: img.src
                                }
                                // Only log if it's a real error (not just a loading state)
                                if (img.complete && img.naturalWidth === 0) {
                                  console.error('Image load error:', JSON.stringify(errorDetails, null, 2))
                                }
                                
                                // If proxy failed, try direct URL
                                if (!hasError) {
                                  setImageErrors(prev => new Set([...prev, file.id]))
                                  // Component will re-render with direct URL due to key change
                                } else {
                                  // Both failed, show error state
                                  console.error('Both proxy and direct URL failed for:', file.filename)
                                  e.target.style.display = 'none'
                                }
                              }}
                              onLoad={(e) => {
                                const img = e.target
                                // Clear error if it was set
                                if (hasError) {
                                  setImageErrors(prev => {
                                    const newSet = new Set(prev)
                                    newSet.delete(file.id)
                                    return newSet
                                  })
                                }
                              }}
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-100 text-neutral-400">
                              <ImageIcon size={32} className="mb-2" />
                              <p className="text-xs text-center px-2">Failed to load</p>
                            </div>
                          )}

                          {/* Hover Overlay */}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-end justify-between">
                            <div className="min-w-0 flex-1 mr-2">
                              <p className="text-white text-sm font-medium truncate">{file.original_name}</p>
                              <p className="text-white/70 text-xs">{(file.size ? (file.size / 1024).toFixed(1) : '?')} KB • {(new Date(file.uploaded_at)).toLocaleDateString()}</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); copyToClipboard(imageUrl, file.id); }}
                                className="p-1.5 bg-white/20 hover:bg-white text-white hover:text-primary-600 rounded-lg backdrop-blur-sm transition-colors"
                                title="Copy URL"
                              >
                                {copiedId === file.id ? <Check size={16} /> : <LinkIcon size={16} />}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(file.id, file.original_name); }}
                                className="p-1.5 bg-white/20 hover:bg-red-500 text-white rounded-lg backdrop-blur-sm transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}

              {!loading && filteredMedia.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-neutral-200">
                  <ImageIcon className="mx-auto text-neutral-300 mb-4" size={48} />
                  <p className="text-lg font-medium text-neutral-900">No images found</p>
                  <p className="text-neutral-500">Upload some assets to get started.</p>
                </div>
              )}
            </div>

            {/* Sidebar Upload Zone */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className={`
                        w-full aspect-[4/5] rounded-3xl border-3 border-dashed flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-300
                        ${isDragActive
                      ? 'border-primary-500 bg-primary-50 scale-105 shadow-xl'
                      : 'border-neutral-300 bg-white hover:border-primary-400 hover:bg-neutral-50 shadow-sm hover:shadow-md'
                    }
                        ${uploading ? 'opacity-50 pointer-events-none' : ''}
                     `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-6 text-primary-500">
                    {uploading ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" /> : <Upload size={32} />}
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">Upload Assets</h3>
                  <p className="text-neutral-500 text-sm mb-6">Drag & drop images here<br />or click to browse</p>
                  <div className="text-xs text-neutral-400 font-medium px-4 py-2 bg-neutral-100 rounded-full">
                    Supports PNG, JPG, WEBP
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lightbox Modal */}
        {preview && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center backdrop-blur-sm" onClick={() => setPreview(null)}>
            <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
              <X size={32} />
            </button>

            <div className="max-w-7xl max-h-screen p-4 flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
              {(() => {
                const previewUrl = getImageUrl(preview.filename)
                const previewHasError = imageErrors.has(preview.id)
                
                return previewUrl && !previewHasError ? (
                  <img
                    src={previewUrl}
                    alt={preview.original_name}
                    className="max-h-[80vh] w-auto object-contain rounded-lg shadow-2xl"
                    onError={(e) => {
                      const img = e.target
                      // Check if image actually failed or if it's just loading
                      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                        return // Image actually loaded, ignore error
                      }
                      // Only log if it's a real error
                      if (img.complete && img.naturalWidth === 0) {
                        console.error('Preview image load error:', JSON.stringify({
                          fileId: preview.id,
                          filename: preview.filename,
                          url: previewUrl,
                          error: img.error?.message || 'Unknown error',
                          naturalWidth: img.naturalWidth,
                          naturalHeight: img.naturalHeight
                        }, null, 2))
                      }
                      setImageErrors(prev => new Set([...prev, preview.id]))
                    }}
                    onLoad={() => {
                      // Clear error if it was set
                      setImageErrors(prev => {
                        const newSet = new Set(prev)
                        newSet.delete(preview.id)
                        return newSet
                      })
                    }}
                  />
                ) : (
                  <div className="max-h-[80vh] w-auto flex flex-col items-center justify-center bg-neutral-800 rounded-lg p-12 text-white">
                    <ImageIcon size={64} className="mb-4 text-neutral-400" />
                    <p className="text-lg">Failed to load image</p>
                    <p className="text-sm text-neutral-400 mt-2">{preview.filename}</p>
                  </div>
                )
              })()}

              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20">
                <div className="text-white pr-4 border-r border-white/20">
                  <p className="font-medium">{preview.original_name}</p>
                  <p className="text-xs text-white/60">{preview.size ? (preview.size / 1024).toFixed(1) : '?'} KB • {new Date(preview.uploaded_at).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(getImageUrl(preview.filename), 'preview')}
                  className="p-2 text-white hover:text-primary-400 transition-colors"
                  title="Copy Link"
                >
                  {copiedId === 'preview' ? <Check size={20} /> : <LinkIcon size={20} />}
                </button>
                <a
                  href={getImageUrl(preview.filename)}
                  download={preview.original_name}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 text-white hover:text-primary-400 transition-colors"
                  title="Download"
                >
                  <Download size={20} />
                </a>
              </div>
            </div>
          </div>
        )}

      </Container>
    </div>
  )
}

export default MediaManager

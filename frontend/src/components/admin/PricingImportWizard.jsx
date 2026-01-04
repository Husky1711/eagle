import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Map,
  Eye,
  ChevronRight,
  ChevronLeft,
  Settings,
  Info
} from 'lucide-react'
import { adminAPI } from '../../services/api'

const FIELD_OPTIONS = [
  { value: '', label: '-- Ignore --' },
  { value: 'courier', label: 'Courier' },
  { value: 'weight_min', label: 'Weight Min' },
  { value: 'weight_max', label: 'Weight Max' },
  { value: 'distance_min', label: 'Distance Min' },
  { value: 'distance_max', label: 'Distance Max' },
  { value: 'price_per_kg', label: 'Price Per Kg' },
  { value: 'base_price', label: 'Base Price' },
  { value: 'custom', label: 'Custom Field' }
]

const PricingImportWizard = ({ onClose }) => {
  const [step, setStep] = useState(1) // 1: Upload, 2: Mapping, 3: Preview, 4: Results
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [analysisResult, setAnalysisResult] = useState(null)
  const [columnMapping, setColumnMapping] = useState({})
  const [importMode, setImportMode] = useState('create')
  const [importType, setImportType] = useState('standard') // 'standard' or 'zone_based'
  const [selectedCourier, setSelectedCourier] = useState('') // For zone-based imports
  const [couriers, setCouriers] = useState([]) // Available couriers
  const [weightConversionMethod, setWeightConversionMethod] = useState('point_to_range')
  const [serviceType, setServiceType] = useState('')
  const [previewData, setPreviewData] = useState(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef(null)

  // Helper function to format error messages
  const formatError = (errorDetail) => {
    if (!errorDetail) return 'An unknown error occurred'
    if (typeof errorDetail === 'string') return errorDetail
    if (typeof errorDetail === 'object') {
      // Handle mapping_errors object
      if (errorDetail.mapping_errors && Array.isArray(errorDetail.mapping_errors)) {
        return errorDetail.mapping_errors.map(err => err.message || JSON.stringify(err)).join('. ')
      }
      // Handle other error objects
      if (errorDetail.message) return errorDetail.message
      if (errorDetail.detail) return errorDetail.detail
      // Try to stringify the object
      return JSON.stringify(errorDetail)
    }
    return String(errorDetail)
  }

  // Check if required fields are mapped
  const getRequiredFieldsStatus = () => {
    const requiredFields = ['courier', 'weight_min', 'weight_max', 'price_per_kg']
    const mappedFields = new Set()

    Object.values(columnMapping).forEach(mapping => {
      if (mapping.mapped_field && mapping.mapped_field !== 'custom') {
        mappedFields.add(mapping.mapped_field)
      }
    })

    const missingFields = requiredFields.filter(field => !mappedFields.has(field))
    return {
      allMapped: missingFields.length === 0,
      missingFields: missingFields,
      mappedCount: mappedFields.size
    }
  }

  // Load couriers on mount
  useEffect(() => {
    const loadCouriers = async () => {
      try {
        const response = await adminAPI.getCouriers()
        setCouriers(response.data || [])
      } catch (err) {
        console.error('Failed to load couriers:', err)
      }
    }
    loadCouriers()
  }, [])

  // Initialize column mapping and detect import type when analysis result is available
  useEffect(() => {
    if (analysisResult) {
      // Check if zone-based import is detected
      if (analysisResult.zone_detection && analysisResult.zone_detection.is_zone_based) {
        setImportType('zone_based')
      } else {
        setImportType('standard')
      }

      // Initialize column mapping for standard imports
      if (analysisResult.mapping_suggestions && importType === 'standard') {
        const initialMapping = {}
        analysisResult.columns.forEach(column => {
          const suggestion = analysisResult.mapping_suggestions[column]
          if (suggestion && suggestion.field) {
            initialMapping[column] = {
              mapped_field: suggestion.field,
              field_type: suggestion.field_type || 'text',
              show_in_ui: true,
              custom_field_name: null
            }
          } else {
            initialMapping[column] = {
              mapped_field: '',
              field_type: 'text',
              show_in_ui: true,
              custom_field_name: null
            }
          }
        })
        setColumnMapping(initialMapping)
      }
    }
  }, [analysisResult, importType])

  const handleFileSelect = async (selectedFile) => {
    const validExtensions = ['.xlsx', '.xls', '.csv']
    const fileExt = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'))

    if (!validExtensions.includes(fileExt)) {
      setError(`Invalid file format. Supported: ${validExtensions.join(', ')}`)
      return
    }

    const maxSize = 10 * 1024 * 1024
    if (selectedFile.size > maxSize) {
      setError(`File too large. Maximum size: ${maxSize / 1024 / 1024}MB`)
      return
    }

    setFile(selectedFile)
    setError('')
    setUploading(true)

    try {
      const response = await adminAPI.analyzeImportFile(selectedFile)
      setAnalysisResult(response.data)
      setUploading(false)
      setStep(2) // Move to mapping step
    } catch (err) {
      setUploading(false)
      const errorDetail = err.response?.data?.detail || err.message || 'Failed to analyze file'
      setError(formatError(errorDetail))
      console.error('Import analyze error:', err)
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
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleMappingChange = (columnName, field, value) => {
    setColumnMapping(prev => ({
      ...prev,
      [columnName]: {
        ...prev[columnName],
        [field]: value
      }
    }))
  }

  const handlePreview = async () => {
    // Skip preview for zone-based imports
    if (importType === 'zone_based') {
      setError('Zone-based imports skip preview and go directly to execution')
      return
    }

    setLoadingPreview(true)
    setError('')

    try {
      // Convert columnMapping to API format
      const apiMapping = {}
      Object.keys(columnMapping).forEach(column => {
        const mapping = columnMapping[column]
        apiMapping[column] = {
          column_name: column,
          mapped_field: mapping.mapped_field || null,
          field_type: mapping.field_type || 'text',
          show_in_ui: mapping.show_in_ui !== false,
          custom_field_name: mapping.mapped_field === 'custom' ? mapping.custom_field_name || column : null
        }
      })

      const response = await adminAPI.previewImport({
        file_id: analysisResult.file_id,
        column_mapping: apiMapping,
        import_mode: importMode
      })

      setPreviewData(response.data)
      setStep(3) // Move to preview step
    } catch (err) {
      const errorDetail = err.response?.data?.detail || err.message || 'Failed to generate preview'
      setError(formatError(errorDetail))
      console.error('Preview error:', err)
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleExecute = async () => {
    setExecuting(true)
    setError('')

    try {
      let executePayload = {
        file_id: analysisResult.file_id,
        import_mode: importMode,
        import_type: importType
      }

      if (importType === 'zone_based') {
        // Zone-based import - simplified payload
        if (!selectedCourier) {
          setError('Please select a courier for zone-based import')
          setExecuting(false)
          return
        }

        executePayload = {
          ...executePayload,
          courier: selectedCourier,
          weight_conversion_method: weightConversionMethod,
          service_type: serviceType || null,
          column_mapping: {} // Empty for zone-based (zones are auto-detected)
        }
      } else {
        // Standard import - convert columnMapping to API format
        const apiMapping = {}
        Object.keys(columnMapping).forEach(column => {
          const mapping = columnMapping[column]
          apiMapping[column] = {
            column_name: column,
            mapped_field: mapping.mapped_field || null,
            field_type: mapping.field_type || 'text',
            show_in_ui: mapping.show_in_ui !== false,
            custom_field_name: mapping.mapped_field === 'custom' ? mapping.custom_field_name || column : null
          }
        })
        executePayload.column_mapping = apiMapping
      }

      const response = await adminAPI.executeImport(executePayload)

      setImportResult(response.data)
      setStep(4) // Move to results step
    } catch (err) {
      const errorDetail = err.response?.data?.detail || err.message || 'Failed to execute import'
      setError(formatError(errorDetail))
      console.error('Execute error:', err)
    } finally {
      setExecuting(false)
    }
  }

  const reset = () => {
    setFile(null)
    setError('')
    setAnalysisResult(null)
    setColumnMapping({})
    setPreviewData(null)
    setUploading(false)
    setLoadingPreview(false)
    setIsDragActive(false)
    setStep(1)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getSampleValue = (columnName) => {
    if (!analysisResult || !analysisResult.sample_rows || analysisResult.sample_rows.length === 0) {
      return 'N/A'
    }
    return analysisResult.sample_rows[0][columnName] || 'N/A'
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
      />

      {/* Slide-over Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-100 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              <FileSpreadsheet className="text-primary-500" />
              Import Pricing Rules
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <div className={`px-2 py-1 rounded text-xs font-medium ${step >= 1 ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-500'}`}>
                Upload
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
              <div className={`px-2 py-1 rounded text-xs font-medium ${step >= 2 ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-500'}`}>
                Map
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
              <div className={`px-2 py-1 rounded text-xs font-medium ${step >= 3 ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-500'}`}>
                Preview
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
              <div className={`px-2 py-1 rounded text-xs font-medium ${step >= 4 ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-500'}`}>
                Results
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-500 hover:text-neutral-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-50">
          {/* Step 1: Upload */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${isDragActive
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-300 hover:border-primary-400 hover:bg-neutral-50'
                  } ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
                onClick={() => !uploading && fileInputRef.current?.click()}
              >
                {uploading ? (
                  <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
                    <p className="text-neutral-700 font-medium">Analyzing file...</p>
                  </div>
                ) : file ? (
                  <div className="flex flex-col items-center space-y-4">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                    <div>
                      <p className="text-neutral-900 font-medium">{file.name}</p>
                      <p className="text-sm text-neutral-500 mt-1">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        reset()
                      }}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Choose different file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="p-4 bg-primary-100 rounded-full">
                      <Upload className="w-8 h-8 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-neutral-900 font-medium">Drag & drop your file here</p>
                      <p className="text-sm text-neutral-500 mt-1">or click to browse</p>
                    </div>
                    <p className="text-xs text-neutral-400">
                      Supported formats: .xlsx, .xls, .csv (Max 10MB)
                    </p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInputChange}
              />

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3"
                  >
                    <AlertCircle size={20} />
                    <span className="text-sm">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 2 && analysisResult && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-blue-900 font-medium text-sm">Column Mapping</p>
                  <p className="text-blue-700 text-xs mt-1">
                    Map your Excel columns to pricing rule fields. Auto-suggestions are provided based on column names.
                  </p>
                  {(() => {
                    const status = getRequiredFieldsStatus()
                    if (!status.allMapped) {
                      return (
                        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <p className="text-amber-900 text-xs font-medium mb-1">
                            ⚠️ Required fields not mapped:
                          </p>
                          <p className="text-amber-800 text-xs">
                            {status.missingFields.map(field => field.replace('_', ' ')).join(', ')}
                          </p>
                          <p className="text-amber-700 text-xs mt-1">
                            Please map these fields before previewing.
                          </p>
                        </div>
                      )
                    }
                    return (
                      <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                        <p className="text-emerald-900 text-xs font-medium">
                          ✓ All required fields are mapped
                        </p>
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* Import Type Selection - Always visible so users can switch modes */}
              {analysisResult && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <label className="block text-sm font-medium text-purple-900 mb-3">
                    Import Type
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setImportType('standard')}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${importType === 'standard'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
                        }`}
                    >
                      Standard Import
                    </button>
                    <button
                      onClick={() => setImportType('zone_based')}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${importType === 'zone_based'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
                        }`}
                    >
                      Zone-Based Import
                    </button>
                  </div>
                  {importType === 'zone_based' && (
                    <div className="mt-4 space-y-4">
                      <div className="bg-white rounded-lg p-3 border border-purple-100">
                        <p className="text-xs font-medium text-purple-900 mb-2">
                          🎯 Zone Detection Results
                        </p>
                        <div className="space-y-1 text-xs text-purple-800">
                          <p>• {analysisResult.zone_detection.zone_count} zone columns detected</p>
                          <p>• Weight column: {analysisResult.zone_detection.weight_column || 'Not detected'}</p>
                          <p className="mt-2 font-medium">
                            Estimated: {analysisResult.total_rows} rows × {analysisResult.zone_detection.zone_count} zones = {analysisResult.total_rows * analysisResult.zone_detection.zone_count} pricing rules
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-purple-900 mb-2">
                          Select Courier *
                        </label>
                        <select
                          value={selectedCourier}
                          onChange={(e) => setSelectedCourier(e.target.value)}
                          className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        >
                          <option value="">-- Select Courier --</option>
                          {couriers.map(courier => (
                            <option key={courier.id} value={courier.id}>
                              {courier.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-purple-900 mb-2">
                          Weight Conversion Method
                        </label>
                        <select
                          value={weightConversionMethod}
                          onChange={(e) => setWeightConversionMethod(e.target.value)}
                          className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="point_to_range">Point to Range (0.5kg → 0-0.5kg)</option>
                          <option value="point_to_next">Point to Next (0.5kg → 0.5-1.0kg)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-purple-900 mb-2">
                          Service Type (Optional)
                        </label>
                        <input
                          type="text"
                          value={serviceType}
                          onChange={(e) => setServiceType(e.target.value)}
                          placeholder="e.g., UPS Envelope, Package"
                          className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Standard Import - Column Mapping (only show for standard import) */}
              {importType === 'standard' && (
                <>
                  {/* Import Mode Selection */}
                  <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                    <label className="block text-sm font-medium text-neutral-700 mb-3">Import Mode</label>
                    <div className="flex gap-3">
                      {[
                        { value: 'create', label: 'Create New Only' },
                        { value: 'update', label: 'Update Existing + Create New' },
                        { value: 'skip_duplicates', label: 'Skip Duplicates' }
                      ].map(mode => (
                        <button
                          key={mode.value}
                          onClick={() => setImportMode(mode.value)}
                          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${importMode === mode.value
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
                            }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Column Mapping Table */}
                  <div className="border border-neutral-200 rounded-xl overflow-hidden">
                    <div className="bg-neutral-50 px-6 py-3 border-b border-neutral-200">
                      <h3 className="text-sm font-semibold text-neutral-900">Map Columns</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-neutral-50 border-b border-neutral-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Column Name</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Sample Data</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Map To Field</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Show in UI</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                          {analysisResult.columns.map((column, idx) => {
                            const mapping = columnMapping[column] || { mapped_field: '', field_type: 'text', show_in_ui: true }
                            const suggestion = analysisResult.mapping_suggestions?.[column]

                            return (
                              <tr key={idx} className="hover:bg-neutral-50">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-neutral-900">{column}</span>
                                    {suggestion && suggestion.field && (
                                      <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                        Auto-detected
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-sm text-neutral-600 font-mono">
                                    {getSampleValue(column)}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <select
                                    value={mapping.mapped_field || ''}
                                    onChange={(e) => handleMappingChange(column, 'mapped_field', e.target.value)}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  >
                                    {FIELD_OPTIONS.map(opt => (
                                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                  </select>
                                  {mapping.mapped_field === 'custom' && (
                                    <input
                                      type="text"
                                      placeholder="Custom field name"
                                      value={mapping.custom_field_name || ''}
                                      onChange={(e) => handleMappingChange(column, 'custom_field_name', e.target.value)}
                                      className="mt-2 w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                                    />
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <label className="flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={mapping.show_in_ui !== false}
                                      onChange={(e) => handleMappingChange(column, 'show_in_ui', e.target.checked)}
                                      className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                                    />
                                  </label>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* Zone-Based Import Info */}
              {importType === 'zone_based' && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <p className="text-sm text-purple-900 font-medium mb-2">
                    ✓ Zone-Based Import Ready
                  </p>
                  <p className="text-xs text-purple-700">
                    Your file will be automatically transformed: each weight row will create {analysisResult?.zone_detection?.zone_count || 0} pricing rules (one per zone).
                    No manual column mapping needed!
                  </p>
                </div>
              )}

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3"
                  >
                    <AlertCircle size={20} />
                    <span className="text-sm">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && previewData && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-900 font-medium">Preview Generated</p>
                    <div className="mt-2 flex gap-4 text-sm text-emerald-700">
                      <span>Will Create: <strong>{previewData.stats.will_create}</strong></span>
                      {previewData.stats.will_update > 0 && (
                        <span>Will Update: <strong>{previewData.stats.will_update}</strong></span>
                      )}
                      {previewData.stats.will_skip > 0 && (
                        <span>Will Skip: <strong>{previewData.stats.will_skip}</strong></span>
                      )}
                      <span>Errors: <strong className={previewData.stats.total_errors > 0 ? 'text-red-600' : ''}>{previewData.stats.total_errors}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Table */}
              {previewData.preview_rows.length > 0 && (
                <div className="border border-neutral-200 rounded-xl overflow-hidden">
                  <div className="bg-neutral-50 px-6 py-3 border-b border-neutral-200">
                    <h3 className="text-sm font-semibold text-neutral-900">Preview (First 20 Rows)</h3>
                  </div>
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-neutral-700">Row</th>
                          {Object.keys(previewData.preview_rows[0].data || {}).map(key => (
                            <th key={key} className="px-4 py-2 text-left text-xs font-semibold text-neutral-700">
                              {key.replace('custom_', '').replace('_', ' ')}
                            </th>
                          ))}
                          <th className="px-4 py-2 text-left text-xs font-semibold text-neutral-700">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {previewData.preview_rows.map((row, idx) => (
                          <tr key={idx} className={row.has_errors ? 'bg-red-50' : ''}>
                            <td className="px-4 py-2 font-medium">{row.row_number}</td>
                            {Object.entries(row.data || {}).map(([key, value]) => (
                              <td key={key} className="px-4 py-2 text-neutral-600">
                                {typeof value === 'number' ? value.toFixed(2) : String(value)}
                              </td>
                            ))}
                            <td className="px-4 py-2">
                              {row.has_errors ? (
                                <span className="text-xs text-red-600 font-medium">Errors</span>
                              ) : (
                                <span className="text-xs text-emerald-600 font-medium">Valid</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Errors */}
              {previewData.errors && previewData.errors.length > 0 && (
                <div className="border border-red-200 rounded-xl overflow-hidden">
                  <div className="bg-red-50 px-6 py-3 border-b border-red-200">
                    <h3 className="text-sm font-semibold text-red-900">Validation Errors</h3>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {previewData.errors.map((err, idx) => (
                      <div key={idx} className="px-6 py-2 border-b border-red-100 last:border-0">
                        <p className="text-sm text-red-700">
                          <strong>Row {err.row}</strong> - {err.column}: {err.error}
                          {err.value && <span className="text-red-600"> (Value: {err.value})</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 4: Results */}
          {step === 4 && importResult && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className={`border-2 rounded-xl p-6 ${importResult.error_count === 0
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-amber-50 border-amber-200'
                }`}>
                <div className="flex items-center gap-3 mb-4">
                  {importResult.error_count === 0 ? (
                    <CheckCircle2 className="text-emerald-600" size={32} />
                  ) : (
                    <AlertCircle className="text-amber-600" size={32} />
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900">Import Complete</h3>
                    <p className="text-sm text-neutral-600">
                      {importResult.error_count === 0
                        ? 'All rules imported successfully!'
                        : 'Import completed with some errors'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="bg-white rounded-lg p-4 border border-neutral-200">
                    <p className="text-xs text-neutral-500 mb-1">Success</p>
                    <p className="text-2xl font-bold text-emerald-600">{importResult.success_count}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-neutral-200">
                    <p className="text-xs text-neutral-500 mb-1">Errors</p>
                    <p className="text-2xl font-bold text-red-600">{importResult.error_count}</p>
                  </div>
                  {importResult.skipped_count > 0 && (
                    <div className="bg-white rounded-lg p-4 border border-neutral-200">
                      <p className="text-xs text-neutral-500 mb-1">Skipped</p>
                      <p className="text-2xl font-bold text-amber-600">{importResult.skipped_count}</p>
                    </div>
                  )}
                  <div className="bg-white rounded-lg p-4 border border-neutral-200">
                    <p className="text-xs text-neutral-500 mb-1">Total</p>
                    <p className="text-2xl font-bold text-neutral-900">
                      {importResult.success_count + importResult.error_count + (importResult.skipped_count || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Imported Rules */}
              {importResult.imported_rules && importResult.imported_rules.length > 0 && (
                <div className="border border-neutral-200 rounded-xl overflow-hidden">
                  <div className="bg-neutral-50 px-6 py-3 border-b border-neutral-200">
                    <h3 className="text-sm font-semibold text-neutral-900">
                      Imported Rules ({importResult.imported_rules.length})
                    </h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="divide-y divide-neutral-200">
                      {importResult.imported_rules.map((rule, idx) => (
                        <div key={idx} className="px-6 py-3 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-neutral-900">
                              {rule.action === 'created' ? 'Created' : 'Updated'} Rule
                            </p>
                            <p className="text-xs text-neutral-500">ID: {rule.id}</p>
                            {rule.courier && (
                              <p className="text-xs text-neutral-500">Courier: {rule.courier}</p>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${rule.action === 'created'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-blue-100 text-blue-700'
                            }`}>
                            {rule.action}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Errors */}
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="border border-red-200 rounded-xl overflow-hidden">
                  <div className="bg-red-50 px-6 py-3 border-b border-red-200">
                    <h3 className="text-sm font-semibold text-red-900">
                      Import Errors ({importResult.errors.length})
                    </h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {importResult.errors.map((err, idx) => (
                      <div key={idx} className="px-6 py-3 border-b border-red-100 last:border-0">
                        <p className="text-sm text-red-700">
                          <strong>Row {err.row}</strong> - {err.column}: {err.error}
                          {err.value && <span className="text-red-600"> (Value: {err.value})</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-neutral-100 p-6 flex justify-between items-center">
          <button
            onClick={() => {
              if (step > 1) {
                setStep(step - 1)
                setError('')
              } else {
                onClose()
              }
            }}
            className="px-4 py-2 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
          >
            <ChevronLeft size={16} />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          <div className="flex gap-3">
            {step === 2 && (() => {
              // For zone-based imports, skip preview and go directly to execute
              if (importType === 'zone_based') {
                const canExecute = selectedCourier && analysisResult?.zone_detection?.is_zone_based
                return (
                  <button
                    onClick={handleExecute}
                    disabled={executing || !canExecute}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!selectedCourier ? 'Please select a courier' : ''}
                  >
                    {executing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        Execute Zone Import
                        <ChevronRight size={16} />
                      </>
                    )}
                  </button>
                )
              }

              // Standard import - show preview button
              const status = getRequiredFieldsStatus()
              return (
                <button
                  onClick={handlePreview}
                  disabled={loadingPreview || !status.allMapped}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!status.allMapped ? `Please map required fields: ${status.missingFields.join(', ')}` : ''}
                >
                  {loadingPreview ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Generating Preview...
                    </>
                  ) : (
                    <>
                      Preview
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>
              )
            })()}
            {step === 3 && (
              <button
                onClick={handleExecute}
                disabled={executing || (previewData?.stats?.total_errors > 0)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {executing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    Execute Import
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            )}
            {step === 4 && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default PricingImportWizard

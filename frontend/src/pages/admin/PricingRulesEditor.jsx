import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Edit,
  Trash2,
  DollarSign,
  X,
  Truck,
  Scale,
  Map,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Upload,
  Tag,

  Filter,
  Search,
  ChevronDown
} from 'lucide-react'
import Container from '../../components/common/Container'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import { adminAPI } from '../../services/api'
import PricingImportWizard from '../../components/admin/PricingImportWizard'
import PricingRuleBuilder from '../../components/admin/PricingRuleBuilder'

const PricingRulesEditor = () => {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showBuilder, setShowBuilder] = useState(false)
  const [showImportWizard, setShowImportWizard] = useState(false)
  const [showDataTools, setShowDataTools] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [couriers, setCouriers] = useState([])
  const [formData, setFormData] = useState({
    courier: '',
    weight_range: { min: 0, max: 0, unit: 'kg' },
    distance_zones: [{ min: 0, max: 0, price_per_kg: 0 }],
    active: true,
    custom_fields: {}
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [filterServiceType, setFilterServiceType] = useState('')
  const [filterCourier, setFilterCourier] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [rulesRes, couriersRes] = await Promise.all([
        adminAPI.getPricingRules(),
        adminAPI.getCouriers()
      ])
      setRules(rulesRes.data || [])
      setCouriers(couriersRes.data || [])
    } catch (error) {
      setError('Failed to load pricing data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getCourierName = (id) => {
    const courier = couriers.find(c => c.id === id)
    return courier ? courier.name : id
  }

  const getCourierLogo = (id) => {
    const courier = couriers.find(c => c.id === id)
    return courier?.logo ? `/uploads/${courier.logo}` : null
  }

  const handleOpenModal = (rule = null) => {
    if (rule) {
      setEditingRule(rule.id)
      setFormData({
        courier: rule.courier || '',
        weight_range: rule.weight_range || { min: 0, max: 0, unit: 'kg' },
        distance_zones: rule.distance_zones || [{ min: 0, max: 0, price_per_kg: 0 }],
        active: rule.active !== undefined ? rule.active : true,
        custom_fields: rule.custom_fields || {}
      })
    } else {
      setEditingRule(null)
      setFormData({
        courier: '',
        weight_range: { min: 0, max: 0, unit: 'kg' },
        distance_zones: [{ min: 0, max: 0, price_per_kg: 0 }],
        active: true,
        custom_fields: {}
      })
    }
    setShowModal(true)
    setError('')
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingRule(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      // Basic validation
      if (formData.distance_zones.some(z => z.max <= z.min)) {
        throw new Error('Invalid distance zone: Max distance must be greater than Min distance')
      }

      if (editingRule) {
        await adminAPI.updatePricingRule(editingRule, formData)
        setSuccess('Rule updated successfully')
      } else {
        await adminAPI.createPricingRule(formData)
        setSuccess('Rule created successfully')
      }
      setTimeout(() => setSuccess(''), 3000)
      fetchData()
      handleCloseModal()
    } catch (error) {
      setError(error.response?.data?.detail || error.message || 'Failed to save rule')
    }
  }

  const handleDelete = async (ruleId) => {
    if (!confirm('Delete this pricing rule? This cannot be undone.')) return

    try {
      await adminAPI.deletePricingRule(ruleId)
      setSuccess('Rule deleted')
      setTimeout(() => setSuccess(''), 3000)
      fetchData()
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to delete rule')
    }
  }

  // Zone Builder Logic
  const addDistanceZone = () => {
    const lastZone = formData.distance_zones[formData.distance_zones.length - 1]
    const newMin = lastZone ? lastZone.max : 0
    setFormData({
      ...formData,
      distance_zones: [...formData.distance_zones, { min: newMin, max: newMin + 50, price_per_kg: 0 }]
    })
  }

  const removeDistanceZone = (index) => {
    const newZones = formData.distance_zones.filter((_, i) => i !== index)
    setFormData({ ...formData, distance_zones: newZones })
  }

  const updateDistanceZone = (index, field, value) => {
    const newZones = [...formData.distance_zones]
    newZones[index] = { ...newZones[index], [field]: parseFloat(value) || 0 }
    setFormData({ ...formData, distance_zones: newZones })
  }

  const [expandedCourierId, setExpandedCourierId] = useState(null)

  // Extract unique Service Types for filter
  const serviceTypes = useMemo(() => {
    const types = new Set()
    rules.forEach(r => {
      if (r.custom_fields?.service_type) types.add(r.custom_fields.service_type)
    })
    return Array.from(types)
  }, [rules])

  // Filter and Group Rules
  const groupedRules = useMemo(() => {
    const groups = {}

    // Apply Filters First
    let filtered = rules.filter(rule => {
      // Filter by Courier
      if (filterCourier && rule.courier !== filterCourier) return false

      // Filter by Service Type
      if (filterServiceType && rule.custom_fields?.service_type !== filterServiceType) return false

      // Search Query (Zone Name or Custom Fields)
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesZone = rule.zone_name?.toLowerCase().includes(query)
        const matchesCustom = rule.custom_fields && Object.values(rule.custom_fields).some(v => String(v).toLowerCase().includes(query))
        if (!matchesZone && !matchesCustom) return false
      }

      return true
    })

    // Then Group
    filtered.forEach(rule => {
      if (!groups[rule.courier]) groups[rule.courier] = []
      groups[rule.courier].push(rule)
    })
    return groups
  }, [rules, filterCourier, filterServiceType, searchQuery])

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <Container>
        <div className="py-8 space-y-8">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Pricing Engine</h1>
              <p className="text-neutral-500 mt-1">Configure shipping rates based on weight and distance</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowImportWizard(true)}
                className="bg-white hover:bg-neutral-50 text-neutral-700 shadow-sm hover:shadow-md border border-neutral-200 rounded-xl px-5 py-2.5 flex items-center gap-2.5 transition-all"
              >
                <div className="bg-emerald-50 p-1.5 rounded-lg text-emerald-600">
                  <Upload size={18} strokeWidth={2.5} />
                </div>
                <span className="font-semibold">Import Excel</span>
              </Button>
              <Button
                onClick={() => setShowBuilder(true)}
                className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 border-0 rounded-xl px-6 py-2.5 flex items-center gap-2 transform transition-all hover:-translate-y-0.5"
              >
                <div className="bg-white/20 p-1 rounded-full backdrop-blur-sm">
                  <Plus size={18} className="text-white" />
                </div>
                <span className="font-semibold">Add New Rule</span>
              </Button>
            </div>
          </div>

          {/* Smart Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <input
                type="text"
                placeholder="Search zones, countries, or rule details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Filters Group */}
            <div className="flex gap-4 overflow-x-auto pb-1 md:pb-0">

              {/* Courier Filter */}
              <div className="relative min-w-[150px]">
                <Truck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                <select
                  value={filterCourier}
                  onChange={(e) => setFilterCourier(e.target.value)}
                  className={`w-full appearance-none pl-10 pr-8 py-2.5 rounded-xl border outline-none cursor-pointer transition-all ${filterCourier ? 'bg-primary-50 border-primary-200 text-primary-700 font-medium' : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                    }`}
                >
                  <option value="">All Couriers</option>
                  {couriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${filterCourier ? 'text-primary-500' : 'text-neutral-400'}`} size={16} />
              </div>

              {/* Service Type Filter */}
              {serviceTypes.length > 0 && (
                <div className="relative min-w-[160px]">
                  <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                  <select
                    value={filterServiceType}
                    onChange={(e) => setFilterServiceType(e.target.value)}
                    className={`w-full appearance-none pl-10 pr-8 py-2.5 rounded-xl border outline-none cursor-pointer transition-all ${filterServiceType ? 'bg-primary-50 border-primary-200 text-primary-700 font-medium' : 'bg-neutral-50 border-neutral-200 text-neutral-600'
                      }`}
                  >
                    <option value="">All Service Types</option>
                    {serviceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${filterServiceType ? 'text-primary-500' : 'text-neutral-400'}`} size={16} />
                </div>
              )}

              {/* Reset Button */}
              {(searchQuery || filterCourier || filterServiceType) && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setFilterCourier('')
                    setFilterServiceType('')
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                >
                  <X size={16} />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 mb-6">
                  <AlertCircle size={20} />
                  {error}
                </div>
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl flex items-center gap-3 mb-6">
                  <CheckCircle2 size={20} />
                  {success}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content */}
          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-neutral-200">
              <DollarSign className="mx-auto text-neutral-300 mb-4" size={48} />
              <p className="text-lg font-medium text-neutral-900">No pricing rules defined</p>
              <Button onClick={() => handleOpenModal()} className="mt-6" variant="outline">
                Define First Rule
              </Button>
            </div>
          ) : Object.keys(groupedRules).length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-neutral-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="text-neutral-400" size={32} />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-1">No matching rules found</h3>
              <p className="text-neutral-500 mb-6">Try adjusting your filters or search query</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  setFilterCourier('')
                  setFilterServiceType('')
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-10">
              {Object.entries(groupedRules).map(([courierId, courierRules]) => {
                const isExpanded = expandedCourierId === courierId
                const visibleRules = isExpanded ? courierRules : courierRules.slice(0, 4)
                const hasMore = courierRules.length > 4

                return (
                  <div key={courierId} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 p-1 flex items-center justify-center">
                          {getCourierLogo(courierId) ? (
                            <img src={getCourierLogo(courierId)} alt="" className="w-full h-full object-contain" />
                          ) : (
                            <Truck size={16} className="text-neutral-400" />
                          )}
                        </div>
                        <h2 className="text-xl font-bold text-neutral-900">{getCourierName(courierId)}</h2>
                        <span className="text-sm text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                          {courierRules.length} Strategies
                        </span>
                      </div>

                      {/* Show Less button when expanded */}
                      {isExpanded && hasMore && (
                        <button
                          onClick={() => setExpandedCourierId(null)}
                          className="text-sm font-medium text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
                        >
                          Show Less
                        </button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {visibleRules
                        .map((rule) => (
                          <motion.div
                            key={rule.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group bg-white rounded-2xl border border-neutral-200 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300 overflow-hidden"
                          >
                            {/* Card Header */}
                            <div className="p-5 border-b border-neutral-100 bg-neutral-50/50">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2 text-primary-700 font-medium">
                                  <Scale size={18} />
                                  <span>Weight Tier</span>
                                </div>
                                <div className={`px-2 py-1 rounded-full text-xs font-semibold ${rule.active ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-500'}`}>
                                  {rule.active ? 'Active' : 'Inactive'}
                                </div>
                              </div>
                              <div className="text-2xl font-bold text-neutral-900">
                                {rule.weight_range?.min} - {rule.weight_range?.max} <span className="text-base font-normal text-neutral-500">{rule.weight_range?.unit}</span>
                              </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-5 space-y-4">
                              {rule.pricing_type === 'zone' ? (
                                <div>
                                  <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                                    <Map size={16} className="text-purple-500" />
                                    <span>Destination Zone</span>
                                  </div>
                                  <div className="flex justify-between items-center text-sm text-neutral-600 bg-purple-50 p-2 rounded-lg border border-purple-100">
                                    <span className="font-semibold text-purple-900">{rule.zone_name}</span>
                                    <span className="font-bold text-neutral-900">₹{rule.price}</span>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                                    <Map size={16} className="text-neutral-400" />
                                    <span>Distance Zones ({rule.distance_zones?.length || 0})</span>
                                  </div>
                                  <div className="space-y-1.5">
                                    {rule.distance_zones?.slice(0, 3).map((zone, idx) => (
                                      <div key={idx} className="flex justify-between text-sm text-neutral-600 bg-neutral-50 p-1.5 rounded">
                                        <span>{zone.min || 0}-{zone.max || zone.max_distance} km</span>
                                        <span className="font-medium text-neutral-900">₹{zone.price_per_kg}/kg</span>
                                      </div>
                                    ))}
                                    {(rule.distance_zones?.length || 0) > 3 && (
                                      <div className="text-xs text-center text-neutral-400 py-1">
                                        + {(rule.distance_zones?.length || 0) - 3} more zones
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Custom Fields */}
                              {rule.custom_fields && Object.keys(rule.custom_fields).length > 0 && (
                                <div className="pt-4 border-t border-neutral-100">
                                  <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                                    <Tag size={14} className="text-blue-500" />
                                    <span className="text-xs">Custom Fields</span>
                                  </div>
                                  <div className="space-y-1.5">
                                    {Object.entries(rule.custom_fields).map(([key, value]) => (
                                      <div key={key} className="flex justify-between text-xs text-neutral-600 bg-blue-50 p-1.5 rounded">
                                        <span className="font-medium text-blue-700">{key.replace(/_/g, ' ')}:</span>
                                        <span className="text-blue-900">{String(value)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Card Footer */}
                            <div className="p-4 border-t border-neutral-100 flex gap-3 bg-neutral-50/30">
                              <button
                                onClick={() => handleOpenModal(rule)}
                                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-white hover:shadow-sm border border-transparent hover:border-neutral-200 transition-all"
                              >
                                <Edit size={16} /> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(rule.id)}
                                className="flex-items center justify-center p-2 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                    </div>

                    {/* View All Button */}
                    {!isExpanded && hasMore && (
                      <Button
                        variant="white"
                        className="w-full border-dashed text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 hover:border-neutral-300"
                        onClick={() => setExpandedCourierId(courierId)}
                      >
                        View all {courierRules.length} strategies
                        <ChevronDown size={16} className="ml-2" />
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* New Rule Strategy Builder */}
        <AnimatePresence>
          {showBuilder && (
            <PricingRuleBuilder
              couriers={couriers}
              onClose={() => setShowBuilder(false)}
              onComplete={() => {
                setShowBuilder(false)
                fetchData()
                setSuccess('New rule strategy created successfully!')
                setTimeout(() => setSuccess(''), 3000)
              }}
            />
          )}
        </AnimatePresence>

      </Container>

      {/* Import Wizard */}
      <AnimatePresence>
        {showImportWizard && (
          <PricingImportWizard
            onClose={() => {
              setShowImportWizard(false)
              fetchData() // Refresh rules after import
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default PricingRulesEditor

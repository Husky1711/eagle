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
  AlertCircle
} from 'lucide-react'
import Container from '../../components/common/Container'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import { adminAPI } from '../../services/api'

const PricingRulesEditor = () => {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  const [couriers, setCouriers] = useState([])
  const [formData, setFormData] = useState({
    courier: '',
    weight_range: { min: 0, max: 0, unit: 'kg' },
    distance_zones: [{ min: 0, max: 0, price_per_kg: 0 }],
    active: true
  })
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
        active: rule.active !== undefined ? rule.active : true
      })
    } else {
      setEditingRule(null)
      setFormData({
        courier: '',
        weight_range: { min: 0, max: 0, unit: 'kg' },
        distance_zones: [{ min: 0, max: 0, price_per_kg: 0 }],
        active: true
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

  // Group rules by courier for display
  const groupedRules = useMemo(() => {
    const groups = {}
    rules.forEach(rule => {
      if (!groups[rule.courier]) groups[rule.courier] = []
      groups[rule.courier].push(rule)
    })
    return groups
  }, [rules])

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
            <Button
              onClick={() => handleOpenModal()}
              className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 border-0 rounded-xl px-6 py-2.5 flex items-center gap-2 transform transition-all hover:-translate-y-0.5"
            >
              <div className="bg-white/20 p-1 rounded-full backdrop-blur-sm">
                <Plus size={18} className="text-white" />
              </div>
              <span className="font-semibold">Add New Rule</span>
            </Button>
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
          ) : (
            <div className="space-y-10">
              {Object.entries(groupedRules).map(([courierId, courierRules]) => (
                <div key={courierId} className="space-y-4">
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

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courierRules.map((rule) => (
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
                          <div>
                            <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                              <Map size={16} className="text-neutral-400" />
                              <span>Distance Zones ({rule.distance_zones?.length || 0})</span>
                            </div>
                            <div className="space-y-1.5">
                              {rule.distance_zones?.slice(0, 3).map((zone, idx) => (
                                <div key={idx} className="flex justify-between text-sm text-neutral-600 bg-neutral-50 p-1.5 rounded">
                                  <span>{zone.min}-{zone.max} km</span>
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
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="sticky top-0 bg-white border-b border-neutral-100 p-6 flex justify-between items-center z-10">
                <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                  <DollarSign className="text-primary-500" />
                  {editingRule ? 'Edit Pricing Strategy' : 'New Pricing Strategy'}
                </h2>
                <button onClick={handleCloseModal} className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-500">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-8">

                  {/* Courier & Status */}
                  <div className="grid md:grid-cols-2 gap-6 bg-neutral-50 p-6 rounded-xl border border-neutral-100">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-neutral-700">Courier Service</label>
                      <select
                        className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-shadow"
                        value={formData.courier}
                        onChange={(e) => setFormData({ ...formData, courier: e.target.value })}
                        required
                      >
                        <option value="">Select a Courier</option>
                        {couriers.map((courier) => (
                          <option key={courier.id} value={courier.id}>{courier.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-neutral-700">Strategy Status</label>
                      <div className="flex items-center gap-3 p-2 bg-white border border-neutral-200 rounded-lg h-[46px]">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, active: !formData.active })}
                          className={`flex-1 h-full rounded-md text-sm font-medium transition-colors ${formData.active ? 'bg-primary-50 text-primary-700' : 'text-neutral-500 hover:bg-neutral-50'}`}
                        >
                          Active
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, active: !formData.active })}
                          className={`flex-1 h-full rounded-md text-sm font-medium transition-colors ${!formData.active ? 'bg-red-50 text-red-700' : 'text-neutral-500 hover:bg-neutral-50'}`}
                        >
                          Inactive
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Weight Range */}
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
                      <Scale size={20} className="text-primary-500" />
                      Weight Range
                    </h3>
                    <div className="grid md:grid-cols-3 gap-6">
                      <Input
                        label="Minimum Weight"
                        type="number"
                        step="0.1"
                        value={formData.weight_range.min}
                        onChange={(e) => setFormData({
                          ...formData,
                          weight_range: { ...formData.weight_range, min: parseFloat(e.target.value) || 0 }
                        })}
                        required
                      />
                      <Input
                        label="Maximum Weight"
                        type="number"
                        step="0.1"
                        value={formData.weight_range.max}
                        onChange={(e) => setFormData({
                          ...formData,
                          weight_range: { ...formData.weight_range, max: parseFloat(e.target.value) || 0 }
                        })}
                        required
                      />
                      <Input
                        label="Unit"
                        value={formData.weight_range.unit}
                        onChange={(e) => setFormData({
                          ...formData,
                          weight_range: { ...formData.weight_range, unit: e.target.value }
                        })}
                        placeholder="kg"
                      />
                    </div>
                  </div>

                  {/* Zone Builder */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                        <Map size={20} className="text-primary-500" />
                        Distance & Pricing Zones
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addDistanceZone}
                      >
                        <Plus size={16} className="mr-1" />
                        Add Zone
                      </Button>
                    </div>

                    <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-left">
                        <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase font-semibold">
                          <tr>
                            <th className="px-6 py-3">Min Distance (km)</th>
                            <th className="px-6 py-3">Max Distance (km)</th>
                            <th className="px-6 py-3">Price / kg (₹)</th>
                            <th className="px-6 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 bg-white">
                          {formData.distance_zones.map((zone, index) => (
                            <tr key={index} className="hover:bg-neutral-50/50 transition-colors">
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  value={zone.min}
                                  onChange={(e) => updateDistanceZone(index, 'min', e.target.value)}
                                  className="w-full px-3 py-1.5 border border-neutral-200 rounded-md focus:ring-1 focus:ring-primary-500 outline-none text-sm"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  value={zone.max}
                                  onChange={(e) => updateDistanceZone(index, 'max', e.target.value)}
                                  className="w-full px-3 py-1.5 border border-neutral-200 rounded-md focus:ring-1 focus:ring-primary-500 outline-none text-sm"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <div className="relative">
                                  <span className="absolute left-3 top-1.5 text-neutral-400 text-sm">₹</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={zone.price_per_kg}
                                    onChange={(e) => updateDistanceZone(index, 'price_per_kg', e.target.value)}
                                    className="w-full pl-6 pr-3 py-1.5 border border-neutral-200 rounded-md focus:ring-1 focus:ring-primary-500 outline-none text-sm font-medium text-neutral-900"
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => removeDistanceZone(index)}
                                  className="p-2 text-neutral-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                                  disabled={formData.distance_zones.length === 1}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {formData.distance_zones.length === 0 && (
                        <div className="p-8 text-center text-neutral-500 text-sm">
                          No zones defined. Click "Add Zone" to start.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6 mt-8 border-t border-neutral-100">
                    <Button
                      type="button"
                      variant="white"
                      onClick={handleCloseModal}
                      className="flex-1 shadow-none border border-neutral-200 hover:bg-neutral-50"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white shadow-lg shadow-primary-500/20 border-0"
                    >
                      {editingRule ? 'Save Changes' : 'Create Strategy'}
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

export default PricingRulesEditor

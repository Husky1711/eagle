import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, DollarSign, X } from 'lucide-react'
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
      setError('Failed to load pricing rules')
      console.error(error)
    } finally {
      setLoading(false)
    }
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
    setFormData({
      courier: '',
      weight_range: { min: 0, max: 0, unit: 'kg' },
      distance_zones: [{ min: 0, max: 0, price_per_kg: 0 }],
      active: true
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      if (editingRule) {
        await adminAPI.updatePricingRule(editingRule, formData)
        setSuccess('Pricing rule updated successfully!')
      } else {
        await adminAPI.createPricingRule(formData)
        setSuccess('Pricing rule created successfully!')
      }
      setTimeout(() => setSuccess(''), 3000)
      fetchData()
      handleCloseModal()
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to save pricing rule')
    }
  }

  const handleDelete = async (ruleId) => {
    if (!confirm('Are you sure you want to delete this pricing rule?')) {
      return
    }

    try {
      await adminAPI.deletePricingRule(ruleId)
      setSuccess('Pricing rule deleted successfully!')
      setTimeout(() => setSuccess(''), 3000)
      fetchData()
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to delete pricing rule')
    }
  }

  const addDistanceZone = () => {
    setFormData({
      ...formData,
      distance_zones: [...formData.distance_zones, { min: 0, max: 0, price_per_kg: 0 }]
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
            <h1 className="text-h1">Pricing Rules Editor</h1>
            <p className="text-neutral-600 mt-1">Manage courier pricing rules</p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus size={20} className="mr-2" />
            Add Rule
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

        {/* Rules List */}
        {rules.length > 0 ? (
          <div className="space-y-4">
            {rules.map((rule) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <h3 className="text-lg font-semibold text-neutral-900 capitalize">
                          {rule.courier}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          rule.active 
                            ? 'bg-success-100 text-success-700' 
                            : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          {rule.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-neutral-700 mb-1">Weight Range</p>
                          <p className="text-sm text-neutral-600">
                            {rule.weight_range?.min || 0} - {rule.weight_range?.max || 0} {rule.weight_range?.unit || 'kg'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-700 mb-1">Distance Zones</p>
                          <p className="text-sm text-neutral-600">
                            {rule.distance_zones?.length || 0} zone(s)
                          </p>
                        </div>
                      </div>

                      {rule.distance_zones && rule.distance_zones.length > 0 && (
                        <div className="bg-neutral-50 rounded-lg p-4">
                          <p className="text-sm font-medium text-neutral-700 mb-2">Distance Zones:</p>
                          <div className="space-y-2">
                            {rule.distance_zones.map((zone, idx) => (
                              <div key={idx} className="text-sm text-neutral-600">
                                {zone.min} - {zone.max} km: ₹{zone.price_per_kg}/kg
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenModal(rule)}
                      >
                        <Edit size={16} className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(rule.id)}
                        className="text-error-500 border-error-500 hover:bg-error-50"
                      >
                        <Trash2 size={16} className="mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <DollarSign className="mx-auto text-neutral-300 mb-4" size={48} />
              <p className="text-neutral-600">No pricing rules added yet</p>
              <Button onClick={() => handleOpenModal()} className="mt-4">
                <Plus size={20} className="mr-2" />
                Add First Rule
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
              className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <Card padding="lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-h3">
                    {editingRule ? 'Edit Pricing Rule' : 'Add New Pricing Rule'}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Courier
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      value={formData.courier}
                      onChange={(e) => setFormData({ ...formData, courier: e.target.value })}
                      required
                    >
                      <option value="">Select Courier</option>
                      {couriers.map((courier) => (
                        <option key={courier.id} value={courier.id}>
                          {courier.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <Input
                      label="Min Weight"
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
                      label="Max Weight"
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

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-neutral-700">
                        Distance Zones
                      </label>
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

                    <div className="space-y-4">
                      {formData.distance_zones.map((zone, index) => (
                        <div key={index} className="p-4 border border-neutral-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-neutral-700">
                              Zone {index + 1}
                            </span>
                            {formData.distance_zones.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeDistanceZone(index)}
                                className="text-error-500 hover:text-error-700"
                              >
                                <X size={18} />
                              </button>
                            )}
                          </div>
                          <div className="grid md:grid-cols-3 gap-4">
                            <Input
                              label="Min Distance (km)"
                              type="number"
                              value={zone.min}
                              onChange={(e) => updateDistanceZone(index, 'min', e.target.value)}
                              required
                            />
                            <Input
                              label="Max Distance (km)"
                              type="number"
                              value={zone.max}
                              onChange={(e) => updateDistanceZone(index, 'max', e.target.value)}
                              required
                            />
                            <Input
                              label="Price per kg (₹)"
                              type="number"
                              step="0.01"
                              value={zone.price_per_kg}
                              onChange={(e) => updateDistanceZone(index, 'price_per_kg', e.target.value)}
                              required
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                    <div>
                      <p className="font-medium text-neutral-900">Active</p>
                      <p className="text-sm text-neutral-600">Use in calculations</p>
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
                    >
                      {editingRule ? 'Update Rule' : 'Create Rule'}
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

export default PricingRulesEditor


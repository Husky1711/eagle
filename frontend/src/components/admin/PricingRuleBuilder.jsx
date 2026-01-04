import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Globe, Map, ArrowRight, Save, Scale, AlertCircle, CheckCircle2 } from 'lucide-react'
import Button from '../common/Button'
import Input from '../common/Input'
import InfoTooltip from '../common/InfoTooltip'
import { adminAPI } from '../../services/api'

const PricingRuleBuilder = ({ onClose, onComplete, couriers = [] }) => {
    // Step 0: Strategy Selection, Step 1: Configuration
    const [step, setStep] = useState(0)
    const [strategy, setStrategy] = useState(null) // 'zone' or 'distance'

    // Form State
    const [formData, setFormData] = useState({
        courier: '',
        markup_price: 0,
        active: true,
        // Weight
        weight_range: { min: 0, max: 0, unit: 'kg' },
        // Zone Based
        zone_name: '',
        price: 0,
        // Distance Based
        distance_zones: [{ min: 0, max: 0, price_per_kg: 0 }]
    })

    // UI State
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleStrategySelect = (selectedStrategy) => {
        setStrategy(selectedStrategy)
        setStep(1)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // Build payload based on strategy
            const payload = {
                courier: formData.courier,
                weight_range: formData.weight_range,
                active: formData.active,
                pricing_type: strategy, // Important: Mark the type
                custom_fields: {}
            }

            if (strategy === 'zone') {
                // Zone Based Payload
                payload.zone_name = formData.zone_name
                payload.zone = formData.zone_name.toLowerCase().replace(/[^a-z0-9]/g, '_')
                payload.price = parseFloat(formData.price)
                // Zone rules don't use distance_zones array, but backend might expect it to exist or be empty
                payload.distance_zones = []
            } else {
                // Distance Based Payload
                payload.distance_zones = formData.distance_zones
                // Distance rules don't use zone_name/price
            }

            await adminAPI.createPricingRule(payload)
            onComplete() // Trigger refresh in parent
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create rule')
        } finally {
            setLoading(false)
        }
    }

    // Zone Builder Logic (Distance)
    const addDistanceZone = () => {
        const lastZone = formData.distance_zones[formData.distance_zones.length - 1]
        const newMin = lastZone ? lastZone.max : 0
        setFormData({
            ...formData,
            distance_zones: [...formData.distance_zones, { min: newMin, max: newMin + 50, price_per_kg: 0 }]
        })
    }

    const updateDistanceZone = (index, field, value) => {
        const newZones = [...formData.distance_zones]
        newZones[index] = { ...newZones[index], [field]: parseFloat(value) || 0 }
        setFormData({ ...formData, distance_zones: newZones })
    }

    const removeDistanceZone = (index) => {
        const newZones = formData.distance_zones.filter((_, i) => i !== index)
        setFormData({ ...formData, distance_zones: newZones })
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
                className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-100 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-neutral-900">Pricing Architect</h2>
                        <p className="text-sm text-neutral-500">
                            {step === 0 ? 'Choose a calculation strategy' : `Configuring ${strategy === 'zone' ? 'Zone' : 'Distance'} Rule`}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full text-neutral-400 hover:text-neutral-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-neutral-50">

                    {/* STEP 0: STRATEGY SELECTION */}
                    {step === 0 && (
                        <div className="space-y-6">
                            <div
                                onClick={() => handleStrategySelect('zone')}
                                className="group cursor-pointer bg-white p-6 rounded-2xl border-2 border-transparent hover:border-purple-500 shadow-sm hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Globe size={120} className="text-purple-500" />
                                </div>
                                <div className="relative z-10">
                                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Globe size={24} className="text-purple-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-neutral-900 mb-2">Zone & Flat Rate</h3>
                                    <p className="text-neutral-500 text-sm mb-4">
                                        Best for International Shipping (e.g. USA, UK, UAE). Set a fixed price for a specific country or custom zone.
                                    </p>
                                    <div className="flex items-center text-purple-600 font-medium text-sm">
                                        Select Strategy <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>

                            <div
                                onClick={() => handleStrategySelect('distance')}
                                className="group cursor-pointer bg-white p-6 rounded-2xl border-2 border-transparent hover:border-blue-500 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Map size={120} className="text-blue-500" />
                                </div>
                                <div className="relative z-10">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Map size={24} className="text-blue-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-neutral-900 mb-2">Distance Based</h3>
                                    <p className="text-neutral-500 text-sm mb-4">
                                        Best for Local Delivery. Calculate price based on kilometers traveled (e.g. 0-5km = $10, 5-10km = $15).
                                    </p>
                                    <div className="flex items-center text-blue-600 font-medium text-sm">
                                        Select Strategy <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 1: FORM */}
                    {step === 1 && (
                        <form onSubmit={handleSubmit} className="space-y-8 max-w-xl mx-auto">

                            {/* Courier Selection */}
                            <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <label className="text-sm font-bold text-neutral-900">
                                        Courier Service
                                    </label>
                                    <InfoTooltip
                                        content="Which carrier will fulfill this service? This determines the logo and tracking link shown to the customer."
                                        placement="bottom"
                                    />
                                </div>
                                <select
                                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
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

                            {/* Weight Range */}
                            <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
                                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-neutral-100">
                                    <Scale size={20} className="text-neutral-400" />
                                    <h3 className="text-lg font-bold text-neutral-900">Weight Tier</h3>
                                    <InfoTooltip content="Define the package size for this rule. For example, 0-0.5kg for Documents, 0.5-5kg for Check-in bags." />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-neutral-500 mb-1 block">Min Weight (kg)</label>
                                        <input
                                            type="number" step="0.1"
                                            value={formData.weight_range.min}
                                            onChange={(e) => setFormData({ ...formData, weight_range: { ...formData.weight_range, min: parseFloat(e.target.value) } })}
                                            className="w-full p-3 bg-neutral-50 rounded-xl border-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-neutral-500 mb-1 block">Max Weight (kg)</label>
                                        <input
                                            type="number" step="0.1"
                                            value={formData.weight_range.max}
                                            onChange={(e) => setFormData({ ...formData, weight_range: { ...formData.weight_range, max: parseFloat(e.target.value) } })}
                                            className="w-full p-3 bg-neutral-50 rounded-xl border-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* STRATEGY SPECIFIC FIELDS */}
                            {strategy === 'zone' ? (
                                <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm ring-1 ring-purple-100">
                                    <div className="flex items-center gap-2 mb-6">
                                        <Globe size={20} className="text-purple-500" />
                                        <h3 className="text-lg font-bold text-neutral-900">Destination Zone</h3>
                                        <InfoTooltip content="Enter the Country Name (e.g. USA, UK) exactly as you want it to appear in the 'Destination' dropdown." />
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <Input
                                                label="Country / Zone Name"
                                                placeholder="e.g. United States"
                                                value={formData.zone_name}
                                                onChange={(e) => setFormData({ ...formData, zone_name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <label className="text-sm font-medium text-neutral-700">Flat Price</label>
                                                <InfoTooltip content="The final price charged to the customer for this weight tier to this destination." />
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-4 top-3.5 text-neutral-400">₹</span>
                                                <input
                                                    type="number" step="0.01"
                                                    value={formData.price}
                                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                    className="w-full pl-8 pr-4 py-3 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg font-semibold"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm ring-1 ring-blue-100">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2">
                                            <Map size={20} className="text-blue-500" />
                                            <h3 className="text-lg font-bold text-neutral-900">Distance Slabs</h3>
                                            <InfoTooltip content="Configure price increments based on distance traveled." />
                                        </div>
                                        <button type="button" onClick={addDistanceZone} className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                                            + Add Slab
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {formData.distance_zones.map((zone, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-blue-50/50 p-2 rounded-xl">
                                                <div className="flex-1">
                                                    <label className="text-[10px] uppercase font-bold text-blue-400 ml-1">Range (km)</label>
                                                    <div className="flex bg-white rounded-lg border border-blue-100 overflow-hidden">
                                                        <input
                                                            type="number" value={zone.min}
                                                            onChange={(e) => updateDistanceZone(idx, 'min', e.target.value)}
                                                            className="w-1/2 p-2 text-center text-sm outline-none border-r border-blue-50"
                                                        />
                                                        <input
                                                            type="number" value={zone.max}
                                                            onChange={(e) => updateDistanceZone(idx, 'max', e.target.value)}
                                                            className="w-1/2 p-2 text-center text-sm outline-none"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="w-24">
                                                    <label className="text-[10px] uppercase font-bold text-blue-400 ml-1">Price/Kg</label>
                                                    <input
                                                        type="number" value={zone.price_per_kg}
                                                        onChange={(e) => updateDistanceZone(idx, 'price_per_kg', e.target.value)}
                                                        className="w-full p-2 bg-white rounded-lg border border-blue-100 text-center text-sm font-semibold outline-none"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeDistanceZone(idx)}
                                                    className="mt-4 p-2 text-neutral-400 hover:text-red-500"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm">
                                    <AlertCircle size={16} /> {error}
                                </div>
                            )}

                        </form>
                    )}

                </div>

                {/* Footer Actions */}
                {step === 1 && (
                    <div className="p-6 bg-white border-t border-neutral-100 flex gap-4">
                        <Button variant="white" onClick={() => setStep(0)} className="flex-1">Back</Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={`flex-[2] text-white border-0 ${strategy === 'zone' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {loading ? 'Saving...' : 'Create Rule'}
                        </Button>
                    </div>
                )}
            </motion.div>
        </div>
    )
}

export default PricingRuleBuilder

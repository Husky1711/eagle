import { useState, useEffect, useRef } from 'react'
import { adminAPI } from '../../services/api'
import Container from '../../components/common/Container'
import { motion, AnimatePresence } from 'framer-motion'
import {
    User,
    Mail,
    Phone,
    Shield,
    Lock,
    CheckCircle2,
    AlertCircle,
    Save,
    Loader2,
    Key,
    Edit3,
    Copy,
    Eye,
    EyeOff,
    Calendar,
    Clock,
    Image as ImageIcon,
    Camera,
    Upload,
    X,
    Grid
} from 'lucide-react'

// --- Constants ---
const AVATAR_PRESETS = [
    "https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg",
    "https://img.freepik.com/free-psd/3d-illustration-person-with-glasses_23-2149436190.jpg",
    "https://img.freepik.com/free-psd/3d-illustration-person-with-punk-hair_23-2149436198.jpg",
    "https://img.freepik.com/free-psd/3d-illustration-person_23-2149436182.jpg",
    "https://img.freepik.com/free-psd/3d-illustration-person-with-long-hair_23-2149436197.jpg",
    "https://img.freepik.com/free-psd/3d-illustration-business-man-with-glasses_23-2149436194.jpg",
    "https://cdn3d.iconscout.com/3d/premium/thumb/man-avatar-6299539-5187871.png",
    "https://cdn3d.iconscout.com/3d/premium/thumb/woman-avatar-6299541-5187873.png"
]

// --- Components ---

const SectionHeader = ({ title, description }) => (
    <div className="mb-6">
        <h3 className="text-lg font-bold text-neutral-900">{title}</h3>
        <p className="text-sm text-neutral-500">{description}</p>
    </div>
)

const InfoRow = ({ label, value, icon: Icon, isEditing, onChange, type = "text", placeholder, copyable, disabled }) => {
    const [copied, setCopied] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const inputType = type === 'password' ? (showPassword ? 'text' : 'password') : type

    return (
        <div className="py-4 border-b border-neutral-100 last:border-0 group">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Label Column */}
                <div className="md:col-span-4 flex items-center space-x-3">
                    <div className="p-2 bg-neutral-50 rounded-lg text-neutral-400 group-hover:text-primary-600 transition-colors">
                        <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-neutral-600">{label}</span>
                </div>

                {/* Value/Input Column */}
                <div className="md:col-span-8">
                    {isEditing && !disabled ? (
                        <div className="relative">
                            <input
                                type={inputType}
                                value={value}
                                onChange={onChange}
                                placeholder={placeholder}
                                className="w-full bg-white border border-neutral-200 text-neutral-900 px-4 py-2.5 rounded-lg outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all font-medium text-sm placeholder-neutral-400 shadow-sm"
                            />
                            {type === 'password' && (
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${!value ? 'text-neutral-400 italic' : 'text-neutral-900'} truncate max-w-[300px]`}>
                                {type === 'password' ? '••••••••' : (value || 'Not set')}
                            </span>
                            {copyable && value && (
                                <button
                                    onClick={handleCopy}
                                    className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                    title="Copy to clipboard"
                                >
                                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

const PasswordStrength = ({ password }) => {
    if (!password) return null
    const strength = Math.min(password.length * 12.5, 100)
    let color = 'bg-red-500'
    let label = 'Weak'
    if (strength > 40) { color = 'bg-amber-500'; label = 'Medium' }
    if (strength > 80) { color = 'bg-emerald-500'; label = 'Strong' }

    return (
        <div className="mt-2 pl-1">
            <div className="flex items-center space-x-2 text-xs">
                <div className="h-1.5 w-24 bg-neutral-100 rounded-full overflow-hidden">
                    <motion.div
                        className={`h-full ${color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${strength}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
                <span className={`font-medium ${color.replace('bg-', 'text-')}`}>{label}</span>
            </div>
        </div>
    )
}

const AvatarModal = ({ isOpen, onClose, onSelect, onUpload, uploading }) => {
    const [activeTab, setActiveTab] = useState('gallery')
    const fileInputRef = useRef(null)

    if (!isOpen) return null

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            onUpload(file)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/20 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-neutral-100"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-100">
                    <h3 className="text-lg font-bold text-neutral-900">Avatar Studio</h3>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-400 hover:text-neutral-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-neutral-100">
                    <button
                        onClick={() => setActiveTab('gallery')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'gallery' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/10' : 'text-neutral-500 hover:text-neutral-800'
                            }`}
                    >
                        <Grid className="w-4 h-4" /> Gallery
                    </button>
                    <button
                        onClick={() => setActiveTab('upload')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'upload' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/10' : 'text-neutral-500 hover:text-neutral-800'
                            }`}
                    >
                        <Upload className="w-4 h-4" /> Upload
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 h-[400px] overflow-y-auto custom-scrollbar">
                    {activeTab === 'gallery' ? (
                        <div className="grid grid-cols-3 gap-4">
                            {AVATAR_PRESETS.map((url, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onSelect(url)}
                                    className="aspect-square rounded-full overflow-hidden border-2 border-transparent hover:border-primary-500 hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-primary-200 group relative"
                                >
                                    <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`w-full h-48 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${uploading
                                        ? 'border-neutral-200 bg-neutral-50 opacity-50 pointer-events-none'
                                        : 'border-neutral-300 hover:border-primary-500 hover:bg-primary-50/10'
                                    }`}
                            >
                                {uploading ? (
                                    <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-3" />
                                ) : (
                                    <Upload className="w-10 h-10 text-neutral-400 mb-3" />
                                )}
                                <span className="text-sm font-medium text-neutral-600">
                                    {uploading ? 'Uploading...' : 'Click to Upload Image'}
                                </span>
                                <span className="text-xs text-neutral-400 mt-1">
                                    JPG, PNG up to 2MB
                                </span>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}

const AdminProfile = () => {
    const [activeTab, setActiveTab] = useState('profile')
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)

    // Data State
    const [profile, setProfile] = useState({
        username: '', email: '', full_name: '', description: '', phone: '', avatar: '', created_at: '', last_login: ''
    })
    const [originalProfile, setOriginalProfile] = useState({})

    const [password, setPassword] = useState({
        current_password: '', new_password: '', confirm_password: ''
    })

    const [notification, setNotification] = useState({ type: '', message: '' })

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            const response = await adminAPI.getProfile()
            setProfile(response.data)
            setOriginalProfile(response.data)
        } catch (error) {
            showNotification('error', 'Failed to load profile')
        } finally {
            setLoading(false)
        }
    }

    const showNotification = (type, message) => {
        setNotification({ type, message })
        setTimeout(() => setNotification({ type: '', message: '' }), 4000)
    }

    const handleCancel = () => {
        setProfile(originalProfile)
        setIsEditing(false)
        setPassword({ current_password: '', new_password: '', confirm_password: '' })
    }

    const handleSaveProfile = async () => {
        setSaving(true)
        try {
            const profileResponse = await adminAPI.updateProfile(profile)
            setProfile(profileResponse.data)
            setOriginalProfile(profileResponse.data)
            showNotification('success', 'Profile updated successfully')
            setIsEditing(false)
        } catch (error) {
            const msg = error.response?.data?.detail || error.message || 'Update failed'
            showNotification('error', msg)
        } finally {
            setSaving(false)
        }
    }

    const handleUpdatePassword = async (e) => {
        e.preventDefault()
        if (password.new_password !== password.confirm_password) {
            showNotification('error', 'New passwords do not match')
            return
        }
        if (!password.current_password) {
            showNotification('error', 'Current password required')
            return
        }

        setSaving(true)
        try {
            await adminAPI.changePassword(password)
            setPassword({ current_password: '', new_password: '', confirm_password: '' })
            showNotification('success', 'Password updated successfully')
        } catch (error) {
            const msg = error.response?.data?.detail || error.message || 'Password update failed'
            showNotification('error', msg)
        } finally {
            setSaving(false)
        }
    }

    // --- Avatar Handlers ---

    const handleSelectAvatar = async (url) => {
        // Optimistically update
        setProfile(prev => ({ ...prev, avatar: url }))
        setIsAvatarModalOpen(false)

        // Auto-save the avatar change
        try {
            await adminAPI.updateProfile({ ...profile, avatar: url })
            setOriginalProfile(prev => ({ ...prev, avatar: url }))
            showNotification('success', 'Avatar updated')
        } catch (error) {
            // Revert on failure
            setProfile(originalProfile)
            showNotification('error', 'Failed to update avatar')
        }
    }

    const handleUploadAvatar = async (file) => {
        setUploadingAvatar(true)
        const formData = new FormData()
        formData.append('file', file)

        try {
            // 1. Upload
            const response = await adminAPI.uploadAvatar(formData)
            const newAvatarUrl = response.data.url

            // 2. Update Profile
            await adminAPI.updateProfile({ ...profile, avatar: newAvatarUrl })
            setProfile(prev => ({ ...prev, avatar: newAvatarUrl }))
            setOriginalProfile(prev => ({ ...prev, avatar: newAvatarUrl }))

            showNotification('success', 'Avatar uploaded & updated')
            setIsAvatarModalOpen(false)
        } catch (error) {
            showNotification('error', 'Upload failed')
        } finally {
            setUploadingAvatar(false)
        }
    }

    if (loading) return (
        <Container>
            <div className="h-[calc(100vh-100px)] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
        </Container>
    )

    return (
        <div className="min-h-[calc(100vh-64px)] bg-neutral-50/50 py-8">
            <Container>

                {/* Avatar Modal */}
                <AnimatePresence>
                    {isAvatarModalOpen && (
                        <AvatarModal
                            isOpen={isAvatarModalOpen}
                            onClose={() => setIsAvatarModalOpen(false)}
                            onSelect={handleSelectAvatar}
                            onUpload={handleUploadAvatar}
                            uploading={uploadingAvatar}
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {notification.message && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, x: '-50%' }}
                            animate={{ opacity: 1, y: 0, x: '-50%' }}
                            exit={{ opacity: 0, y: -20, x: '-50%' }}
                            className={`fixed top-6 left-1/2 z-50 px-6 py-3 rounded-full flex items-center space-x-3 shadow-lg border ${notification.type === 'success'
                                ? 'bg-white border-emerald-100 text-emerald-700'
                                : 'bg-white border-red-100 text-red-700'
                                }`}
                        >
                            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                            <span className="font-medium text-sm">{notification.message}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Account Settings</h1>
                            <p className="text-neutral-500 text-sm mt-1">Manage your identity and access credentials</p>
                        </div>

                        {/* Tabs */}
                        <div className="flex p-1 bg-white border border-neutral-200 rounded-xl shadow-sm">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${activeTab === 'profile'
                                    ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-100'
                                    : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
                                    }`}
                            >
                                <User className="w-4 h-4" />
                                Profile
                            </button>
                            <button
                                onClick={() => setActiveTab('security')}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${activeTab === 'security'
                                    ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-100'
                                    : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
                                    }`}
                            >
                                <Shield className="w-4 h-4" />
                                Security
                            </button>
                        </div>
                    </div>

                    <motion.div
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-soft border border-neutral-100 overflow-hidden"
                    >
                        {/* Common Header */}
                        <div className="bg-gradient-to-r from-primary-50/50 to-secondary-50/50 p-8 border-b border-neutral-100">
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                {/* Avatar with Edit Trigger */}
                                <div className="relative group cursor-pointer" onClick={() => setIsAvatarModalOpen(true)}>
                                    <div className="w-24 h-24 rounded-full bg-white p-1 shadow-md overflow-hidden relative border-2 border-transparent group-hover:border-primary-300 transition-all">
                                        {profile.avatar ? (
                                            <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white uppercase select-none">
                                                {profile.full_name ? profile.full_name.substring(0, 2) : 'AD'}
                                            </div>
                                        )}
                                        {/* Overlay */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-full transition-opacity">
                                            <Camera className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-1 right-1 bg-emerald-500 w-6 h-6 rounded-full border-[3px] border-white shadow-sm" title="Active"></div>
                                </div>

                                {/* Identity Text */}
                                <div className="text-center md:text-left flex-1">
                                    <h2 className="text-2xl font-bold text-neutral-900 mb-1">{profile.full_name || 'Admin'}</h2>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-neutral-500">
                                        <span className="flex items-center">
                                            <Shield className="w-4 h-4 mr-1.5 text-primary-500" />
                                            Administrator
                                        </span>
                                        <button onClick={() => setIsAvatarModalOpen(true)} className="text-primary-600 hover:text-primary-700 font-medium text-xs flex items-center gap-1">
                                            <Edit3 className="w-3 h-3" /> Change Avatar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8">
                            {activeTab === 'profile' ? (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <SectionHeader title="Personal Information" description="Update your public profile details." />
                                        <div className="flex items-center gap-3">
                                            {isEditing ? (
                                                <>
                                                    <button onClick={handleCancel} className="text-sm font-medium text-neutral-500 hover:text-neutral-800">Cancel</button>
                                                    <button
                                                        onClick={handleSaveProfile}
                                                        disabled={saving}
                                                        className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                                                    >
                                                        {saving && <Loader2 className="w-3 h-3 animate-spin" />} Save
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => setIsEditing(true)}
                                                    className="px-4 py-2 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
                                                >
                                                    <Edit3 className="w-3 h-3" /> Edit
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <InfoRow
                                            label="Display Name"
                                            value={profile.full_name}
                                            icon={User}
                                            isEditing={isEditing}
                                            onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                                            placeholder="Your Name"
                                        />
                                        <InfoRow
                                            label="Username"
                                            value={profile.username}
                                            icon={Shield}
                                            disabled
                                            copyable
                                        />
                                        <InfoRow
                                            label="Email Address"
                                            value={profile.email}
                                            icon={Mail}
                                            isEditing={isEditing}
                                            onChange={e => setProfile({ ...profile, email: e.target.value })}
                                            placeholder="name@example.com"
                                        />
                                        <InfoRow
                                            label="Phone Number"
                                            value={profile.phone}
                                            icon={Phone}
                                            isEditing={isEditing}
                                            onChange={e => setProfile({ ...profile, phone: e.target.value })}
                                            placeholder="Add phone number"
                                        />
                                        <InfoRow
                                            label="Role Description"
                                            value={profile.description}
                                            icon={Calendar}
                                            isEditing={isEditing}
                                            onChange={e => setProfile({ ...profile, description: e.target.value })}
                                            placeholder="What do you do?"
                                        />
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <SectionHeader title="Security Settings" description="Update your password and secure your account." />

                                    <form onSubmit={handleUpdatePassword} className="max-w-2xl bg-neutral-50 rounded-xl p-6 border border-neutral-100">
                                        <div className="mb-6">
                                            <label className="block text-sm font-bold text-neutral-700 mb-2">Current Password</label>
                                            <div className="relative">
                                                <input
                                                    type="password"
                                                    value={password.current_password}
                                                    onChange={e => setPassword({ ...password, current_password: e.target.value })}
                                                    className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all bg-white"
                                                    placeholder="Enter current password"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                            <div>
                                                <label className="block text-sm font-bold text-neutral-700 mb-2">New Password</label>
                                                <input
                                                    type="password"
                                                    value={password.new_password}
                                                    onChange={e => setPassword({ ...password, new_password: e.target.value })}
                                                    className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all bg-white"
                                                    placeholder="New password"
                                                />
                                                <PasswordStrength password={password.new_password} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-neutral-700 mb-2">Confirm Password</label>
                                                <input
                                                    type="password"
                                                    value={password.confirm_password}
                                                    onChange={e => setPassword({ ...password, confirm_password: e.target.value })}
                                                    className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all bg-white"
                                                    placeholder="Confirm new password"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-4 border-t border-neutral-200/50">
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                                Update Password
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </Container>
        </div>
    )
}

export default AdminProfile

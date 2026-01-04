import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, RefreshCw, Layout, Menu as MenuIcon, MousePointer, Type, Palette, Plus, Trash2, ArrowRight, MessageCircle, Volume2, Globe } from 'lucide-react'
import Container from '../../components/common/Container'
import Button from '../../components/common/Button'
import { adminAPI } from '../../services/api'
import toast from 'react-hot-toast'
import ImageSelector from '../../components/admin/ImageSelector'
import IconPicker from '../../components/admin/IconPicker'
import { useSettings } from '../../context/SettingsContext'

const GlobalSettings = () => {
    const { updateSettingsLocal } = useSettings()
    const [settings, setSettings] = useState({
        site: {},
        header: { menuItems: [], styles: {} },
        footer: { sections: [], styles: {}, social: {} }
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState('general')

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const response = await adminAPI.getSettings()
            // Ensure defaults
            const data = response.data || {}
            if (!data.header) data.header = { menuItems: [], styles: {} }
            if (!data.footer) data.footer = { sections: [], styles: {}, social: {} }
            setSettings(data)
        } catch (error) {
            console.error('Error fetching settings:', error)
            toast.error('Failed to load settings')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await adminAPI.updateSettings(settings)
            updateSettingsLocal(settings) // Update context immediately
            toast.success('Settings saved successfully')
        } catch (error) {
            console.error('Error saving settings:', error)
            toast.error('Failed to save settings')
        } finally {
            setSaving(false)
        }
    }

    const updateNestedSetting = (path, value) => {
        const newSettings = { ...settings }
        const keys = path.split('.')
        let current = newSettings
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {}
            current = current[keys[i]]
        }
        current[keys[keys.length - 1]] = value
        setSettings(newSettings)
    }

    // ---- HEADER HELPERS ----
    const addMenuItem = () => {
        const newItems = [...(settings.header.menuItems || [])]
        newItems.push({ id: Date.now(), label: 'New Link', path: '/', target: '_self' })
        updateNestedSetting('header.menuItems', newItems)
    }

    const removeMenuItem = (index) => {
        const newItems = [...settings.header.menuItems]
        newItems.splice(index, 1)
        updateNestedSetting('header.menuItems', newItems)
    }

    const updateMenuItem = (index, field, value) => {
        const newItems = [...settings.header.menuItems]
        newItems[index][field] = value
        updateNestedSetting('header.menuItems', newItems)
    }

    // ---- FOOTER HELPERS ----
    const addFooterSection = () => {
        const newCtx = [...(settings.footer.sections || [])]
        newCtx.push({ id: `section_${Date.now()}`, title: 'New Section', type: 'links', items: [] })
        updateNestedSetting('footer.sections', newCtx)
    }

    const removeFooterSection = (idx) => {
        const newCtx = [...settings.footer.sections]
        newCtx.splice(idx, 1)
        updateNestedSetting('footer.sections', newCtx)
    }

    const updateFooterSection = (idx, field, value) => {
        const newCtx = [...settings.footer.sections]
        newCtx[idx][field] = value
        updateNestedSetting('footer.sections', newCtx)
    }

    const addFooterItem = (sectionIdx) => {
        const newCtx = [...settings.footer.sections]
        newCtx[sectionIdx].items.push({ label: 'New Item', path: '/', icon: 'ArrowRight' })
        updateNestedSetting('footer.sections', newCtx)
    }

    const removeFooterItem = (sectionIdx, itemIdx) => {
        const newCtx = [...settings.footer.sections]
        newCtx[sectionIdx].items.splice(itemIdx, 1)
        updateNestedSetting('footer.sections', newCtx)
    }

    const updateFooterItem = (sectionIdx, itemIdx, field, value) => {
        const newCtx = [...settings.footer.sections]
        newCtx[sectionIdx].items[itemIdx][field] = value
        updateNestedSetting('footer.sections', newCtx)
    }

    if (loading) return <div className="p-8 text-center">Loading settings...</div>

    return (
        <Container className="py-8 max-w-5xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Global Settings</h1>
                    <p className="text-neutral-500">Manage your site's header, footer, and general styles</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={fetchSettings}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw size={18} />
                        Reset
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2"
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-neutral-200 overflow-x-auto">
                    {['general', 'header', 'footer', 'chatbot'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-4 font-medium text-sm transition-colors capitalize whitespace-nowrap ${activeTab === tab
                                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                                : 'text-neutral-600 hover:bg-neutral-50'
                                }`}
                        >
                            {tab} Settings
                        </button>
                    ))}
                </div>

                <div className="p-6 md:p-8">
                    {/* ---- GENERAL TAB ---- */}
                    {activeTab === 'general' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <section className="space-y-4">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Layout size={20} className="text-primary-600" />
                                    Site Identity
                                </h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Site Name</label>
                                        <input
                                            type="text"
                                            value={settings.site?.name || ''}
                                            onChange={(e) => updateNestedSetting('site.name', e.target.value)}
                                            className="w-full p-2 border rounded-lg"
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4 border-t pt-8">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Type size={20} className="text-primary-600" />
                                    Contact Information
                                </h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Phone Number</label>
                                        <input
                                            type="text"
                                            value={settings.contact?.phone || ''}
                                            onChange={(e) => updateNestedSetting('contact.phone', e.target.value)}
                                            className="w-full p-2 border rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Email Address</label>
                                        <input
                                            type="text"
                                            value={settings.contact?.email || ''}
                                            onChange={(e) => updateNestedSetting('contact.email', e.target.value)}
                                            className="w-full p-2 border rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">WhatsApp Number</label>
                                        <input
                                            type="text"
                                            value={settings.contact?.whatsapp || ''}
                                            onChange={(e) => updateNestedSetting('contact.whatsapp', e.target.value)}
                                            className="w-full p-2 border rounded-lg"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-1">Office Address</label>
                                        <textarea
                                            value={settings.contact?.address || ''}
                                            onChange={(e) => updateNestedSetting('contact.address', e.target.value)}
                                            className="w-full p-2 border rounded-lg min-h-[80px]"
                                        />
                                    </div>
                                </div>
                            </section>
                            <section className="space-y-4 border-t pt-8">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Globe size={20} className="text-primary-600" />
                                    Social Media Profiles
                                </h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Facebook URL</label>
                                        <input
                                            type="text"
                                            value={settings.social?.facebook || ''}
                                            onChange={(e) => updateNestedSetting('social.facebook', e.target.value)}
                                            className="w-full p-2 border rounded-lg"
                                            placeholder="https://facebook.com/..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Twitter / X URL</label>
                                        <input
                                            type="text"
                                            value={settings.social?.twitter || ''}
                                            onChange={(e) => updateNestedSetting('social.twitter', e.target.value)}
                                            className="w-full p-2 border rounded-lg"
                                            placeholder="https://twitter.com/..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">LinkedIn URL</label>
                                        <input
                                            type="text"
                                            value={settings.social?.linkedin || ''}
                                            onChange={(e) => updateNestedSetting('social.linkedin', e.target.value)}
                                            className="w-full p-2 border rounded-lg"
                                            placeholder="https://linkedin.com/..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Instagram URL</label>
                                        <input
                                            type="text"
                                            value={settings.social?.instagram || ''}
                                            onChange={(e) => updateNestedSetting('social.instagram', e.target.value)}
                                            className="w-full p-2 border rounded-lg"
                                            placeholder="https://instagram.com/..."
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-1">YouTube URL</label>
                                        <input
                                            type="text"
                                            value={settings.social?.youtube || ''}
                                            onChange={(e) => updateNestedSetting('social.youtube', e.target.value)}
                                            className="w-full p-2 border rounded-lg"
                                            placeholder="https://youtube.com/..."
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {/* ---- HEADER TAB ---- */}
                    {activeTab === 'header' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <section className="grid lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-1 space-y-4">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <Layout size={18} className="text-primary-600" />
                                        Logo & Layout
                                    </h3>
                                    <div className="bg-neutral-50 p-4 rounded-xl border">
                                        <ImageSelector
                                            label="Site Logo"
                                            value={settings.header?.logo}
                                            onChange={(img) => updateNestedSetting('header.logo', img)}
                                        />
                                    </div>

                                    {/* --- NEW CTA SECTION --- */}
                                    <h3 className="font-bold flex items-center gap-2 pt-4">
                                        <MousePointer size={18} className="text-primary-600" />
                                        Header Button
                                    </h3>
                                    <div className="bg-neutral-50 p-4 rounded-xl border space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Button Text</label>
                                            <input
                                                type="text"
                                                value={settings.header?.cta?.label || 'Calculate Price'}
                                                onChange={(e) => updateNestedSetting('header.cta.label', e.target.value)}
                                                className="w-full p-2 border rounded-lg text-sm"
                                                placeholder="e.g. Track Shipment"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Button Link</label>
                                            <input
                                                type="text"
                                                value={settings.header?.cta?.path || '/pricing'}
                                                onChange={(e) => updateNestedSetting('header.cta.path', e.target.value)}
                                                className="w-full p-2 border rounded-lg text-sm"
                                                placeholder="/tracking"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 pt-2">
                                            <input
                                                type="checkbox"
                                                id="showCta"
                                                checked={settings.header?.cta?.enabled !== false}
                                                onChange={(e) => updateNestedSetting('header.cta.enabled', e.target.checked)}
                                                className="rounded text-primary-600 focus:ring-primary-500"
                                            />
                                            <label htmlFor="showCta" className="text-sm font-medium">Show Button</label>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-2 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-bold flex items-center gap-2">
                                            <MenuIcon size={18} className="text-primary-600" />
                                            Navigation Menu
                                        </h3>
                                        <Button size="sm" onClick={addMenuItem} className="flex items-center gap-1">
                                            <Plus size={16} /> Add Link
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        {settings.header?.menuItems?.map((item, index) => (
                                            <div key={index} className="flex gap-2 items-center bg-white p-3 border rounded-lg shadow-sm group">
                                                <div className="cursor-move text-neutral-400 p-1"><MenuIcon size={16} /></div>
                                                <input
                                                    type="text"
                                                    value={item.label}
                                                    onChange={(e) => updateMenuItem(index, 'label', e.target.value)}
                                                    placeholder="Link Label"
                                                    className="flex-1 p-2 bg-neutral-50 border rounded text-sm font-medium"
                                                />
                                                <div className="flex items-center gap-2 text-neutral-400">
                                                    <ArrowRight size={14} />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={item.path}
                                                    onChange={(e) => updateMenuItem(index, 'path', e.target.value)}
                                                    placeholder="/path"
                                                    className="flex-1 p-2 bg-neutral-50 border rounded text-sm font-mono text-blue-600"
                                                />
                                                <button
                                                    onClick={() => removeMenuItem(index)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            <section className="border-t pt-8">
                                <h3 className="font-bold flex items-center gap-2 mb-6">
                                    <Palette size={18} className="text-primary-600" />
                                    Theme & Colors
                                </h3>
                                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-sm font-medium block mb-1">Background Color</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={settings.header?.styles?.bgColor || '#ffffff'}
                                                onChange={(e) => updateNestedSetting('header.styles.bgColor', e.target.value)}
                                                className="h-10 w-10 p-0 rounded cursor-pointer border-0"
                                            />
                                            <input
                                                type="text"
                                                value={settings.header?.styles?.bgColor || ''}
                                                onChange={(e) => updateNestedSetting('header.styles.bgColor', e.target.value)}
                                                className="flex-1 border rounded px-2 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium block mb-1">Text Color</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={settings.header?.styles?.textColor || '#000000'}
                                                onChange={(e) => updateNestedSetting('header.styles.textColor', e.target.value)}
                                                className="h-10 w-10 p-0 rounded cursor-pointer border-0"
                                            />
                                            <input
                                                type="text"
                                                value={settings.header?.styles?.textColor || ''}
                                                onChange={(e) => updateNestedSetting('header.styles.textColor', e.target.value)}
                                                className="flex-1 border rounded px-2 text-sm"
                                            />
                                        </div>
                                    </div>
                                    {/* Add more style controls as needed */}
                                </div>
                            </section>
                        </div>
                    )}

                    {/* ---- FOOTER TAB ---- */}
                    {activeTab === 'footer' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <section>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <Layout size={18} className="text-primary-600" />
                                        Footer Sections
                                    </h3>
                                    <Button size="sm" onClick={addFooterSection} className="flex items-center gap-1">
                                        <Plus size={16} /> Add Section
                                    </Button>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {settings.footer?.sections?.map((section, sIdx) => (
                                        <div key={section.id} className="bg-neutral-50 border rounded-xl p-4 space-y-4">
                                            <div className="flex justify-between items-center bg-white p-2 rounded-lg border">
                                                <input
                                                    value={section.title}
                                                    onChange={(e) => updateFooterSection(sIdx, 'title', e.target.value)}
                                                    className="font-bold bg-transparent outline-none w-full"
                                                    placeholder="Section Title"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={section.type}
                                                        onChange={(e) => updateFooterSection(sIdx, 'type', e.target.value)}
                                                        className="text-xs border rounded p-1"
                                                    >
                                                        <option value="links">Links List</option>
                                                        <option value="features">Feature List</option>
                                                    </select>
                                                    <button onClick={() => removeFooterSection(sIdx)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                                {section.items.map((item, iIdx) => (
                                                    <div key={iIdx} className="flex items-start gap-2 bg-white p-2 rounded border text-sm">
                                                        <div className="mt-1">
                                                            <IconPicker
                                                                compact
                                                                value={item.icon || 'ArrowRight'}
                                                                onChange={(icon) => updateFooterItem(sIdx, iIdx, 'icon', icon)}
                                                            />
                                                        </div>
                                                        <div className="flex-1 space-y-1">
                                                            <input
                                                                value={item.label}
                                                                onChange={(e) => updateFooterItem(sIdx, iIdx, 'label', e.target.value)}
                                                                className="w-full bg-transparent border-b border-transparent hover:border-neutral-200 focus:border-primary-500 outline-none pb-0.5"
                                                                placeholder="Link Label"
                                                            />
                                                            {section.type === 'features' ? (
                                                                <input
                                                                    value={item.desc || ''}
                                                                    onChange={(e) => updateFooterItem(sIdx, iIdx, 'desc', e.target.value)}
                                                                    className="w-full text-xs text-neutral-500 bg-transparent border-b border-transparent hover:border-neutral-200 focus:border-primary-500 outline-none"
                                                                    placeholder="Description..."
                                                                />
                                                            ) : (
                                                                <input
                                                                    value={item.path || ''}
                                                                    onChange={(e) => updateFooterItem(sIdx, iIdx, 'path', e.target.value)}
                                                                    className="w-full text-xs text-blue-500 bg-transparent border-b border-transparent hover:border-neutral-200 focus:border-primary-500 outline-none"
                                                                    placeholder="/path"
                                                                />
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => removeFooterItem(sIdx, iIdx)}
                                                            className="text-neutral-400 hover:text-red-500"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => addFooterItem(sIdx)}
                                                    className="w-full py-2 text-primary-600 text-xs font-medium border border-dashed border-primary-200 rounded hover:bg-primary-50 flex items-center justify-center gap-1"
                                                >
                                                    <Plus size={14} /> Add Item
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}

                    {/* ---- CHATBOT TAB ---- */}
                    {activeTab === 'chatbot' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white rounded-xl p-6 md:p-8 relative overflow-hidden">
                                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <MessageCircle size={32} className="text-primary-500" />
                                            <h2 className="text-2xl font-bold">Eagle Assistant</h2>
                                        </div>
                                        <p className="text-neutral-400 mb-6 max-w-lg">
                                            Configure your AI-powered chatbot. Controls appearance, welcome message, and behavior.
                                        </p>
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-lg cursor-pointer hover:bg-white/20 transition-colors border border-white/5">
                                                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                                                    <input
                                                        type="checkbox"
                                                        checked={settings.chatbot?.enabled !== false}
                                                        onChange={(e) => updateNestedSetting('chatbot.enabled', e.target.checked)}
                                                        className="absolute opacity-0 w-0 h-0"
                                                    />
                                                    <span className={`block w-12 h-6 rounded-full shadow-inner transition-colors duration-300 ${settings.chatbot?.enabled !== false ? 'bg-green-500' : 'bg-neutral-600'}`}></span>
                                                    <span className={`absolute block w-4 h-4 mt-1 ml-1 rounded-full shadow-sm bg-white transition-transform duration-300 ${settings.chatbot?.enabled !== false ? 'transform translate-x-6' : ''}`}></span>
                                                </div>
                                                <span className="font-medium">Enable Chatbot</span>
                                            </label>
                                            <label className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-lg cursor-pointer hover:bg-white/20 transition-colors border border-white/5">
                                                <input
                                                    type="checkbox"
                                                    checked={settings.chatbot?.soundEnabled !== false}
                                                    onChange={(e) => updateNestedSetting('chatbot.soundEnabled', e.target.checked)}
                                                    className="w-4 h-4 rounded border-neutral-500 text-primary-600 focus:ring-primary-500 bg-neutral-700"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <Volume2 size={16} />
                                                    <span className="font-medium">Sound Effects</span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-64 bg-white/5 rounded-xl border border-white/10 p-4">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-neutral-400 block mb-2">Position</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {['left-bottom', 'right-bottom'].map(pos => (
                                                        <button
                                                            key={pos}
                                                            onClick={() => updateNestedSetting('chatbot.position', pos)}
                                                            className={`p-2 rounded text-xs border transition-colors ${(settings.chatbot?.position || 'right-bottom') === pos
                                                                ? 'bg-primary-600 border-primary-500 text-white'
                                                                : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10'
                                                                }`}
                                                        >
                                                            {pos.replace('-', ' ').toUpperCase()}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-neutral-400 block mb-2">Primary Color</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="color"
                                                        value={settings.chatbot?.styles?.primaryColor || '#ea580c'}
                                                        onChange={(e) => updateNestedSetting('chatbot.styles.primaryColor', e.target.value)}
                                                        className="h-8 w-8 p-0 rounded cursor-pointer border-0"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={settings.chatbot?.styles?.primaryColor || '#ea580c'}
                                                        onChange={(e) => updateNestedSetting('chatbot.styles.primaryColor', e.target.value)}
                                                        className="flex-1 bg-white/10 border border-white/10 rounded px-2 text-xs text-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500 rounded-full blur-[100px] opacity-20 -mr-16 -mt-16 pointer-events-none"></div>
                            </div>

                            <section className="bg-white p-6 rounded-xl border border-neutral-200">
                                <h3 className="font-bold flex items-center gap-2 mb-4">
                                    <Type size={18} className="text-primary-600" />
                                    Welcome Message
                                </h3>
                                <div className="max-w-2xl">
                                    <label className="block text-sm font-medium mb-1">Initial Greeting</label>
                                    <textarea
                                        value={settings.chatbot?.welcomeMessage || ''}
                                        onChange={(e) => updateNestedSetting('chatbot.welcomeMessage', e.target.value)}
                                        rows={3}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                                        placeholder="Hello! How can I help you with your shipping today?"
                                    />
                                    <p className="text-xs text-neutral-500 mt-1">This message appears when the user opens the chat for the first time.</p>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </Container>
    )
}

export default GlobalSettings

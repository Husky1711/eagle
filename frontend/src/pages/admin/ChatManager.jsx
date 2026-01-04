import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, RefreshCw, MessageCircle, DollarSign, Activity, Database, TrendingUp, Clock, AlertCircle, Sparkles, Wand2 } from 'lucide-react'
import Container from '../../components/common/Container'
import Button from '../../components/common/Button'
import { adminAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

const ChatManager = () => {
    const [activeTab, setActiveTab] = useState('dashboard')
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState(null)
    const [logs, setLogs] = useState([])
    const [models, setModels] = useState([])
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    // Prompt State
    const [promptText, setPromptText] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [lastUpdated, setLastUpdated] = useState(null)

    // Filter States
    const [logPeriod, setLogPeriod] = useState('7d')
    const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' })

    useEffect(() => {
        fetchData()
    }, [activeTab, page, logPeriod, customDateRange])

    const getDateRange = () => {
        const end = new Date()
        let start = new Date()

        if (logPeriod === 'custom') {
            if (!customDateRange.start || !customDateRange.end) return { startDate: null, endDate: null }

            // Set Start to 00:00:00
            const startDate = new Date(customDateRange.start)
            startDate.setHours(0, 0, 0, 0)

            // Set End to 23:59:59
            const endDate = new Date(customDateRange.end)
            endDate.setHours(23, 59, 59, 999)

            return {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            }
        }

        if (logPeriod === '7d') start.setDate(end.getDate() - 7)
        if (logPeriod === '15d') start.setDate(end.getDate() - 15)
        if (logPeriod === '30d') start.setDate(end.getDate() - 30)

        return {
            startDate: start.toISOString(),
            endDate: end.toISOString()
        }
    }

    const fetchData = async () => {
        setLoading(true)
        try {
            if (activeTab === 'dashboard') {
                const { startDate, endDate } = getDateRange()

                // Only fetch if dates are valid (or not custom)
                if (logPeriod === 'custom' && (!startDate || !endDate)) {
                    setLoading(false)
                    return
                }

                // If period is custom, pass 'custom' + dates. Else just period.
                const periodArg = logPeriod
                const startArg = logPeriod === 'custom' ? startDate : null
                const endArg = logPeriod === 'custom' ? endDate : null

                const [statsRes, logsRes] = await Promise.all([
                    adminAPI.getChatUsageStats(periodArg, startArg, endArg),
                    adminAPI.getChatUsageLogs(1, 5, startDate, endDate) // Recent logs also filtered
                ])
                setStats(statsRes.data)
                setLogs(logsRes.data.logs) // Just for recent activity
            } else if (activeTab === 'models') {
                const res = await adminAPI.getChatPricing()
                // Convert dict to array
                const modelsArray = Object.entries(res.data.models).map(([key, value]) => ({
                    model: key,
                    ...value
                }))
                setModels(modelsArray)
            } else if (activeTab === 'logs') {
                const { startDate, endDate } = getDateRange()
                // Only fetch if dates are valid (or not custom)
                if (logPeriod === 'custom' && (!startDate || !endDate)) {
                    setLoading(false)
                    return
                }
                const res = await adminAPI.getChatUsageLogs(page, 20, startDate, endDate)
                setLogs(res.data.logs)
                setTotalPages(res.data.pagination.total_pages)
            } else if (activeTab === 'prompt') {
                const res = await adminAPI.getChatPrompt()
                setPromptText(res.data.prompt)
                setLastUpdated(res.data.last_updated)
            }
        } catch (error) {
            console.error('Error fetching chat data:', error)
            toast.error('Failed to load data')
        } finally {
            setLoading(false)
        }
    }

    const handleModelUpdate = async (modelName, field, value) => {
        const updatedModels = models.map(m =>
            m.model === modelName ? { ...m, [field]: value } : m
        )
        setModels(updatedModels)
    }

    const saveModels = async () => {
        try {
            await adminAPI.bulkUpdateChatPricing({ updates: models })
            toast.success('Model configurations saved!')
        } catch (error) {
            toast.error('Failed to save models')
        }
    }

    const handleSavePrompt = async () => {
        try {
            await adminAPI.updateChatPrompt({ prompt: promptText })
            toast.success('System prompt updated successfully!')
            setLastUpdated(new Date().toISOString())
        } catch (error) {
            toast.error('Failed to save prompt')
        }
    }

    const handleGeneratePrompt = async () => {
        if (!promptText.trim()) return
        setIsGenerating(true)
        try {
            const res = await adminAPI.generateChatPrompt(promptText)
            setPromptText(res.data.prompt)
            toast.success('Prompt enhanced with AI!')
        } catch (error) {
            toast.error('Failed to generate prompt')
        } finally {
            setIsGenerating(false)
        }
    }

    // --- RENDER HELPERS ---

    const FilterControls = () => {
        if (activeTab !== 'dashboard' && activeTab !== 'logs') return null

        return (
            <div className="flex flex-wrap items-center gap-2">
                <select
                    value={logPeriod}
                    onChange={(e) => setLogPeriod(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm border-neutral-300 focus:ring-primary-500 focus:border-primary-500"
                >
                    <option value="7d">Last 7 Days</option>
                    <option value="15d">Last 15 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="custom">Custom Range</option>
                </select>

                {logPeriod === 'custom' && (
                    <>
                        <input
                            type="date"
                            className="px-3 py-2 border rounded-md text-sm"
                            value={customDateRange.start}
                            max={new Date().toISOString().split('T')[0]}
                            onChange={(e) => handleDateChange('start', e.target.value)}
                        />
                        <span className="text-neutral-400">-</span>
                        <input
                            type="date"
                            className="px-3 py-2 border rounded-md text-sm"
                            value={customDateRange.end}
                            min={customDateRange.start}
                            max={new Date().toISOString().split('T')[0]}
                            onChange={(e) => handleDateChange('end', e.target.value)}
                        />
                    </>
                )}
            </div>
        )
    }

    const renderDashboard = () => (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-neutral-500">Total Messages</p>
                            <h3 className="text-2xl font-bold mt-1">{stats?.total_requests || 0}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <MessageCircle size={20} />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-xs text-neutral-500">
                        <span className="text-green-500 font-medium flex items-center gap-1">
                            <TrendingUp size={12} /> +12%
                        </span>
                        <span className="ml-2">from last month</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-neutral-500">Estimated Cost</p>
                            <h3 className="text-2xl font-bold mt-1">${stats?.total_cost_usd?.toFixed(4) || '0.0000'}</h3>
                        </div>
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-neutral-500">Avg Cost/Req</p>
                            <h3 className="text-2xl font-bold mt-1">${stats?.average_cost_per_request?.toFixed(5) || 0}</h3>
                        </div>
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <Activity size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-neutral-500">Tokens Used</p>
                            <h3 className="text-2xl font-bold mt-1">{(stats?.total_tokens / 1000).toFixed(1)}k</h3>
                        </div>
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <Database size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100">
                    <h3 className="text-lg font-bold mb-6">Usage Volume (30 Days)</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.daily_breakdown || []}>
                                <defs>
                                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRequests)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100">
                    <h3 className="text-lg font-bold mb-6">Cost Analysis</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats?.daily_breakdown || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line type="monotone" dataKey="cost_usd" stroke="#10b981" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    )

    const renderModels = () => (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
                <h3 className="text-lg font-bold">Groq Model Registry</h3>
                <Button onClick={saveModels} className="flex items-center gap-2">
                    <Save size={16} /> Save Changes
                </Button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-neutral-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Model ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Context Window</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Input Cost ($/1M)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Output Cost ($/1M)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Speed (TPS)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                        {models.map((model) => (
                            <tr key={model.model}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-neutral-900">{model.model}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="number"
                                        className="w-24 px-2 py-1 border rounded text-sm"
                                        value={model.context_window}
                                        onChange={(e) => handleModelUpdate(model.model, 'context_window', parseInt(e.target.value))}
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-24 px-2 py-1 border rounded text-sm"
                                        value={model.input_price_per_million}
                                        onChange={(e) => handleModelUpdate(model.model, 'input_price_per_million', parseFloat(e.target.value))}
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-24 px-2 py-1 border rounded text-sm"
                                        value={model.output_price_per_million}
                                        onChange={(e) => handleModelUpdate(model.model, 'output_price_per_million', parseFloat(e.target.value))}
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                                    {model.speed_tps || '~'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )

    // Date Validation Helper
    const handleDateChange = (field, value) => {
        const today = new Date().toISOString().split('T')[0]

        // 1. Future Date Check
        if (value > today) {
            toast.error('Date cannot be in the future')
            return
        }

        const newRange = { ...customDateRange, [field]: value }

        // 2. Start > End Check
        if (newRange.start && newRange.end && newRange.start > newRange.end) {
            toast.error('Start date cannot be after End date')
            return
        }

        setCustomDateRange(newRange)
    }

    const renderLogs = () => (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
            <div className="p-6 border-b border-neutral-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="text-lg font-bold">Usage Logs</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-neutral-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Timestamp</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Model</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Tokens (In/Out)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Cost</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Latency</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                        {/* {logs.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-neutral-500">
                                    No logs found for this period
                                </td>
                            </tr>
                        )} */}
                        {logs.map((log) => (
                            <tr key={log.request_id} className="hover:bg-neutral-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 py-1 bg-neutral-100 rounded-full text-xs font-medium text-neutral-600">
                                        {log.model}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                                    {log.input_tokens} / {log.output_tokens}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-neutral-900">
                                    ${log.cost_usd?.toFixed(6)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                                    {log.latency_ms}ms
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="p-4 border-t border-neutral-100 flex justify-between items-center">
                <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                >
                    Previous
                </Button>
                <span className="text-sm text-neutral-500">Page {page} of {totalPages}</span>
                <Button
                    variant="outline"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                >
                    Next
                </Button>
            </div>
        </div>
    )

    const renderPromptSettings = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">System Prompt</h3>
                        <div className="text-sm text-neutral-500">
                            Last Updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Never'}
                        </div>
                    </div>

                    <textarea
                        className="flex-1 w-full p-4 border rounded-lg font-mono text-sm leading-relaxed resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        style={{ minHeight: '400px' }}
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                        placeholder="You are a helpful logistics assistant..."
                    />

                    <div className="flex justify-end mt-4 gap-3">
                        <Button
                            variant="primary"
                            onClick={handleSavePrompt}
                            className="flex items-center gap-2"
                        >
                            <Save size={18} />
                            Save Configuration
                        </Button>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100">
                    <div className="flex items-center gap-2 mb-4">
                        <Wand2 className="text-purple-600" size={24} />
                        <h3 className="text-lg font-bold">AI Editor</h3>
                    </div>
                    <p className="text-sm text-neutral-600 mb-6">
                        Not sure how to prompt? Describe the personality or rules you want, and let our AI optimize the system instructions for you.
                    </p>

                    <textarea
                        className="w-full p-3 border rounded-lg text-sm mb-4 h-32"
                        placeholder="e.g. Make the bot act like a professional logistics manager who prioritizes cost savings..."
                    />

                    <Button
                        onClick={handleGeneratePrompt}
                        disabled={isGenerating}
                        className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        {isGenerating ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                Optimizing...
                            </>
                        ) : (
                            <>
                                <Sparkles size={18} />
                                Auto-Enhance Prompt
                            </>
                        )}
                    </Button>
                </div>

                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <AlertCircle size={18} />
                        Pro Tip
                    </h4>
                    <p className="text-sm text-blue-800">
                        Changes to the system prompt apply immediately to all new chat sessions. Active sessions may not reflect changes until the page is refreshed.
                    </p>
                </div>
            </div>
        </div>
    )

    return (
        <Container className="py-8 max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
                        <MessageCircle className="text-primary-600" />
                        AI Manager
                    </h1>
                    <p className="text-neutral-500">Monitor costs, manage models, and analyze logs</p>
                </div>
                <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
                    <div className="flex gap-2 bg-white p-1 rounded-lg border border-neutral-200">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'dashboard' ? 'bg-primary-50 text-primary-700' : 'text-neutral-600 hover:text-neutral-900'}`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('models')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'models' ? 'bg-primary-50 text-primary-700' : 'text-neutral-600 hover:text-neutral-900'}`}
                        >
                            Model Registry
                        </button>
                        <button
                            onClick={() => setActiveTab('prompt')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'prompt' ? 'bg-primary-50 text-primary-700' : 'text-neutral-600 hover:text-neutral-900'}`}
                        >
                            Prompt Settings
                        </button>
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'logs' ? 'bg-primary-50 text-primary-700' : 'text-neutral-600 hover:text-neutral-900'}`}
                        >
                            Logs
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Controls Row */}
            {(activeTab === 'dashboard' || activeTab === 'logs') && (
                <div className="flex justify-end mb-6">
                    <FilterControls />
                </div>
            )}

            <div className="min-h-[400px]">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'dashboard' && renderDashboard()}
                        {activeTab === 'models' && renderModels()}
                        {activeTab === 'logs' && renderLogs()}
                        {activeTab === 'prompt' && renderPromptSettings()}
                    </>
                )}
            </div>
        </Container>
    )
}

export default ChatManager

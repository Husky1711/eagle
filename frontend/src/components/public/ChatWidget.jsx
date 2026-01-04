import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Minus, RefreshCw, Sparkles, MapPin, Package, DollarSign } from 'lucide-react'
import { publicAPI } from '../../services/api'
import { useSettings } from '../../context/SettingsContext'
import { useLocation } from 'react-router-dom'
import Button from '../common/Button'

// Sound efffects (Base64 for reliability without asset management)
const POP_SOUND = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU..." // Placeholder

const ChatWidget = () => {
    const { settings } = useSettings()
    const location = useLocation()
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef(null)

    // Configuration from Global Settings
    const chatSettings = settings?.chatbot || {}
    const enabled = chatSettings.enabled !== false // Default true
    const position = chatSettings.position || 'right-bottom' // 'right-bottom' | 'left-bottom'
    const title = chatSettings.title || 'Eagle Assistant'
    const primaryColor = chatSettings.styles?.primaryColor || '#ea580c' // Default Orange
    const initialMessage = chatSettings.welcomeMessage || "Hello! How can I help you with your shipping today?"
    const soundEnabled = chatSettings.soundEnabled !== false

    // Load History from Session
    useEffect(() => {
        const saved = sessionStorage.getItem('eagle_chat_history')
        if (saved) {
            setMessages(JSON.parse(saved))
        } else {
            // Add initial message if empty
            setMessages([{ role: 'assistant', content: initialMessage, isWelcome: true }])
        }
    }, [initialMessage])

    // Save History to Session
    useEffect(() => {
        if (messages.length > 0) {
            sessionStorage.setItem('eagle_chat_history', JSON.stringify(messages))
        }
    }, [messages])

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    useEffect(scrollToBottom, [messages, isOpen, isTyping])

    // Play Sound
    const playSound = () => {
        if (soundEnabled) {
            // const audio = new Audio(POP_SOUND)
            // audio.volume = 0.2
            // audio.play().catch(e => console.log('Audio play failed', e))
        }
    }

    const handleSend = async (text = input) => {
        if (!text.trim()) return

        const userMsg = { role: 'user', content: text }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsLoading(true)
        setIsTyping(true)
        playSound()

        try {
            // Prepare history for API (exclude system/welcome messages if needed, but API handles role)
            const history = messages.map(m => ({ role: m.role, content: m.content }))

            // Inject Context
            const pageContext = `User is currently viewing page: ${location.pathname}`
            const fullMessage = `${text} [CONTEXT: ${pageContext}]`

            const response = await publicAPI.chat({
                message: fullMessage,
                conversation_history: history
            })

            const botMsg = { role: 'assistant', content: response.data?.response }
            setMessages(prev => [...prev, botMsg])
            playSound()
        } catch (error) {
            console.error('Chat error:', error)
            setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again later." }])
        } finally {
            setIsLoading(false)
            setIsTyping(false)
        }
    }

    const handleQuickAction = (action) => {
        handleSend(action)
    }

    if (!enabled) return null

    const isRight = position === 'right-bottom'

    return (
        <div className={`fixed z-50 bottom-6 ${isRight ? 'right-6' : 'left-6'} flex flex-col items-${isRight ? 'end' : 'start'} pointer-events-none`}>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`mb-4 w-[320px] md:w-[350px] bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl overflow-hidden flex flex-col pointer-events-auto`}
                        style={{
                            height: '500px',
                            maxHeight: '70vh',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        }}
                    >
                        {/* Header */}
                        <div
                            className="p-4 flex items-center justify-between text-white relative overflow-hidden"
                            style={{ background: `linear-gradient(135deg, ${primaryColor}, #000000)` }}
                        >
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                    <Sparkles size={20} className="text-yellow-300" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg leading-none">{title}</h3>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                        <span className="text-xs opacity-90">Online & Ready</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 relative z-10">
                                <button onClick={() => setMessages([])} className="p-2 hover:bg-white/20 rounded-full transition-colors" title="Clear Chat">
                                    <RefreshCw size={16} />
                                </button>
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-neutral-50/50">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role === 'assistant' && (
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-neutral-800 to-black text-white flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-1">E</div>
                                    )}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.role === 'user'
                                            ? 'bg-neutral-900 text-white rounded-tr-none'
                                            : 'bg-white text-neutral-800 border border-neutral-100 rounded-tl-none'
                                            }`}
                                        style={msg.role === 'user' ? { backgroundColor: primaryColor } : {}}
                                    >
                                        {msg.content}
                                    </motion.div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="w-6 h-6 rounded-full bg-neutral-200 mr-2 flex-shrink-0"></div>
                                    <div className="bg-white border rounded-2xl px-4 py-3 rounded-tl-none">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></span>
                                            <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce delay-100"></span>
                                            <span className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce delay-200"></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Actions (Contextual) */}
                        <div className="px-4 py-2 flex flex-wrap gap-2 bg-neutral-50 border-t border-neutral-100">
                            <button onClick={() => handleQuickAction('Check shipping rates')} className="text-xs px-3 py-1.5 bg-white border border-neutral-200 rounded-full hover:border-primary-500 hover:text-primary-600 transition-colors flex items-center gap-1 shadow-sm">
                                <DollarSign size={12} /> Rates
                            </button>
                            <button onClick={() => handleQuickAction('Track a package')} className="text-xs px-3 py-1.5 bg-white border border-neutral-200 rounded-full hover:border-primary-500 hover:text-primary-600 transition-colors flex items-center gap-1 shadow-sm">
                                <Package size={12} /> Tracking
                            </button>
                            <button onClick={() => handleQuickAction('Contact support')} className="text-xs px-3 py-1.5 bg-white border border-neutral-200 rounded-full hover:border-primary-500 hover:text-primary-600 transition-colors flex items-center gap-1 shadow-sm">
                                <MessageCircle size={12} /> Support
                            </button>
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-neutral-100">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="flex gap-2"
                            >
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 bg-neutral-50 px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all text-sm"
                                    disabled={isLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !input.trim()}
                                    className="w-12 h-12 flex items-center justify-center rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    style={{ backgroundColor: input.trim() ? primaryColor : undefined }}
                                >
                                    <Send size={20} className={input.trim() ? 'ml-0.5' : ''} />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Toggle Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white relative z-50 overflow-hidden group pointer-events-auto"
                style={{
                    background: `linear-gradient(135deg, ${primaryColor}, #000000)`,
                    boxShadow: `0 8px 30px -4px ${primaryColor}80`
                }}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                        >
                            <Minus size={32} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                        >
                            <MessageCircle size={32} className="fill-current" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Ping animation when closed */}
                {!isOpen && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
                )}
            </motion.button>
        </div>
    )
}

export default ChatWidget

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info } from 'lucide-react'

const InfoTooltip = ({ content, Label, placement = 'top' }) => {
    const [isVisible, setIsVisible] = useState(false)

    const positionClasses = {
        top: 'bottom-full mb-2',
        bottom: 'top-full mt-2'
    }

    const arrowClasses = {
        top: '-bottom-1',
        bottom: '-top-1'
    }

    return (
        <div
            className="relative inline-flex items-center gap-1.5"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {Label && <span className="text-sm font-medium text-neutral-700">{Label}</span>}
            <button
                type="button"
                className="text-primary-400 hover:text-primary-600 transition-colors focus:outline-none"
                onClick={() => setIsVisible(!isVisible)}
            >
                <Info size={16} />
            </button>

            <AnimatePresence>
                {isVisible && (
                    <div className={`absolute left-0 ${positionClasses[placement] || positionClasses.top} w-64 z-50 pointer-events-none`}>
                        <motion.div
                            initial={{ opacity: 0, y: placement === 'top' ? 5 : -5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: placement === 'top' ? 5 : -5, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="bg-neutral-900/95 backdrop-blur-sm text-white p-3 rounded-xl shadow-xl text-xs leading-relaxed border border-neutral-700/50"
                        >
                            <div className="flex items-start gap-2">
                                <span className="text-lg">💡</span>
                                <span>{content}</span>
                            </div>
                            <div className={`absolute left-4 ${arrowClasses[placement] || arrowClasses.top} w-2 h-2 bg-neutral-900 rotate-45 transform`}></div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default InfoTooltip

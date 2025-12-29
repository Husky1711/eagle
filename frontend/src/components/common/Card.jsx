import { motion } from 'framer-motion'

const Card = ({
  children,
  className = '',
  hover = true,
  padding = 'md',
  ...props
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }
  
  const baseClasses = `bg-white rounded-card shadow-soft ${paddingClasses[padding]} ${className}`
  
  if (hover) {
    return (
      <motion.div
        className={baseClasses}
        whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0, 0, 0, 0.16)' }}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
  
  return (
    <div className={baseClasses} {...props}>
      {children}
    </div>
  )
}

export default Card


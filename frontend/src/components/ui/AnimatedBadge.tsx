import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface AnimatedBadgeProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function AnimatedBadge({ children, className = '', delay = 0 }: AnimatedBadgeProps) {
  return (
    <motion.div
      animate={{
        y: [0, -6, 0],
      }}
      transition={{
        duration: 3.5,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      className={`inline-flex items-center gap-2 rounded-full border-2 border-cyan-500 bg-white/95 px-4.5 py-2 text-xs font-black text-brand-950 shadow-lg shadow-cyan-500/20 backdrop-blur-md dark:border-cyan-400 dark:bg-slate-900/90 dark:text-cyan-300 ${className}`}
    >
      <span className="relative flex size-2.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-cyan-400 opacity-80" />
        <span className="relative inline-flex size-2.5 rounded-full bg-cyan-500" />
      </span>
      {children}
    </motion.div>
  )
}

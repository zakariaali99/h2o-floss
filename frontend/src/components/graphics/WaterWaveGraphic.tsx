import { motion } from 'framer-motion'

export function WaterWaveGraphic() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 select-none">
      {/* High-Contrast Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[550px] rounded-full bg-gradient-to-tr from-cyan-500/30 via-sky-400/20 to-brand-600/10 blur-3xl dark:from-cyan-600/20 dark:via-brand-900/10" />

      {/* Floating Animated Particles with Distinct Borders */}
      <motion.div
        animate={{
          y: [0, -25, 0],
          x: [0, 15, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-12 start-[10%] size-28 rounded-full border-2 border-brand-400/60 bg-gradient-to-br from-cyan-400/50 via-sky-300/40 to-brand-500/20 blur-lg dark:from-cyan-500/20"
      />

      <motion.div
        animate={{
          y: [0, 30, 0],
          x: [0, -20, 0],
          scale: [1, 1.25, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute bottom-16 end-[12%] size-36 rounded-full border-2 border-cyan-400/60 bg-gradient-to-tl from-sky-500/40 via-cyan-400/30 to-transparent blur-xl dark:from-cyan-400/15"
      />

      {/* SVG Waves with Rich Vivid Gradients */}
      <svg
        className="absolute w-full h-full opacity-45 dark:opacity-20"
        viewBox="0 0 1440 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          animate={{
            d: [
              'M0,192L48,208C96,224,192,256,288,245.3C384,235,480,181,576,176C672,171,768,213,864,229.3C960,245,1056,235,1152,213.3C1248,192,1344,160,1392,144L1440,128L1440,600L1392,600C1344,600,1248,600,1152,600C1056,600,960,600,864,600C768,600,672,600,576,600C480,600,384,600,288,600C192,600,96,600,48,600L0,600Z',
              'M0,160L48,176C96,192,192,224,288,234.7C384,245,480,235,576,208C672,181,768,139,864,149.3C960,160,1056,224,1152,234.7C1248,245,1344,203,1392,181.3L1440,160L1440,600L1392,600C1344,600,1248,600,1152,600C1056,600,960,600,864,600C768,600,672,600,576,600C480,600,384,600,288,600C192,600,96,600,48,600L0,600Z',
              'M0,192L48,208C96,224,192,256,288,245.3C384,235,480,181,576,176C672,171,768,213,864,229.3C960,245,1056,235,1152,213.3C1248,192,1344,160,1392,144L1440,128L1440,600L1392,600C1344,600,1248,600,1152,600C1056,600,960,600,864,600C768,600,672,600,576,600C480,600,384,600,288,600C192,600,96,600,48,600L0,600Z',
            ],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          fill="url(#vivid-water-gradient)"
        />

        <defs>
          <linearGradient id="vivid-water-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

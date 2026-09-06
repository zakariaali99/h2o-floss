import { motion } from 'framer-motion'

export function HydroBubbleCanvas() {
  // 12 Elegantly balanced floating bubbles across the hero canvas
  const bubbles = [
    { size: 28, left: '5%', duration: 7.5, delay: 0 },
    { size: 44, left: '14%', duration: 10.0, delay: 1.6 },
    { size: 20, left: '23%', duration: 6.8, delay: 0.5 },
    { size: 36, left: '33%', duration: 8.8, delay: 2.2 },
    { size: 48, left: '44%', duration: 11.0, delay: 1.0 },
    { size: 24, left: '54%', duration: 7.2, delay: 2.8 },
    { size: 40, left: '63%', duration: 9.2, delay: 0.3 },
    { size: 22, left: '73%', duration: 6.5, delay: 2.0 },
    { size: 46, left: '82%', duration: 10.5, delay: 1.4 },
    { size: 26, left: '91%', duration: 7.8, delay: 0.8 },
    { size: 32, left: '28%', duration: 8.4, delay: 3.5 },
    { size: 30, left: '68%', duration: 8.0, delay: 4.0 },
  ]

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* 1. Ambient Radial Hydro Lighting for Light and Dark Modes */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[700px] rounded-full bg-gradient-to-tr from-cyan-400/30 via-sky-300/20 to-transparent blur-3xl dark:from-cyan-500/40 dark:via-sky-500/25 dark:to-transparent" />
      <div className="absolute top-2/3 right-10 size-[450px] rounded-full bg-cyan-500/20 blur-3xl dark:from-cyan-400/30 dark:via-blue-600/20" />

      {/* 2. Floating Animated Hydro Bubbles */}
      {bubbles.map((b, i) => (
        <motion.div
          key={i}
          initial={{ y: '105vh', opacity: 0 }}
          animate={{
            y: '-15vh',
            opacity: [0, 0.95, 0.95, 0],
            x: [0, i % 2 === 0 ? 30 : -30, i % 3 === 0 ? -20 : 20, 0],
          }}
          transition={{
            duration: b.duration,
            repeat: Infinity,
            delay: b.delay,
            ease: 'linear',
          }}
          style={{
            left: b.left,
            width: b.size,
            height: b.size,
          }}
          className="absolute rounded-full border-2 border-cyan-500/70 bg-gradient-to-tr from-cyan-500/40 via-sky-400/50 to-white/90 backdrop-blur-xs shadow-[0_0_18px_rgba(6,182,212,0.6)] dark:border-cyan-300 dark:from-cyan-400/60 dark:via-sky-400/50 dark:to-cyan-200/90 dark:shadow-[0_0_24px_rgba(34,211,238,0.85)]"
        >
          {/* Internal Specular Light Highlight (Refraction) */}
          <span className="absolute top-1 start-1 size-2 rounded-full bg-white/80 dark:bg-white blur-[0.5px]" />
        </motion.div>
      ))}

      {/* 3. Fluid Wave SVG Path with Vivid Dynamic Gradient */}
      <svg className="absolute bottom-0 w-full h-64 opacity-60 dark:opacity-45" viewBox="0 0 1440 320" fill="none">
        <motion.path
          animate={{
            d: [
              'M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,197.3C960,213,1056,203,1152,181.3C1248,160,1344,128,1392,112L1440,96L1440,320L0,320Z',
              'M0,128L48,144C96,160,192,192,288,197.3C384,203,480,181,576,160C672,139,768,117,864,138.7C960,160,1056,224,1152,213.3C1248,203,1344,117,1392,74.7L1440,32L1440,320L0,320Z',
              'M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,144C672,139,768,181,864,197.3C960,213,1056,203,1152,181.3C1248,160,1344,128,1392,112L1440,96L1440,320L0,320Z',
            ],
          }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          fill="url(#vividWaveGrad)"
        />
        <defs>
          <linearGradient id="vividWaveGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#0284c7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

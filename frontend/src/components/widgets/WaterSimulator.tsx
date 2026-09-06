import { useState, useRef } from 'react'
import {
  Gauge,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react'

const simulatorModes = [
  {
    id: 'soft',
    name: 'الوضع اللطيف (Soft)',
    psi: 40,
    pulses: 1000,
    frequency: '16.6 Hz',
    badge: 'للأسنان الحساسة والمبتدئين',
    target: 'اللثة الحساسة والنزيف الخفيف',
    desc: 'ضخ مائي لطيف ومنخفض الضغط (40 PSI) يدلك أنسجة اللثة الحساسة بلطف وينظف البقايا دون أي ألم. الخيار الأمثل للمستخدمين الجدد.',
  },
  {
    id: 'medium',
    name: 'الوضع المتوسط (Medium)',
    psi: 70,
    pulses: 1150,
    frequency: '19.1 Hz',
    badge: 'تنظيف يومي متوازن',
    target: 'إزالة البلاك وبقايا الطعام اليومية',
    desc: 'تدفق مائي متوسط القوة (70 PSI) يزيل 92% من جزيئات الطعام العالقة بين الفواصل الضيقة ويحافظ على انتعاش الفم طوال اليوم.',
  },
  {
    id: 'normal',
    name: 'الوضع القياسي (Normal)',
    psi: 100,
    pulses: 1250,
    frequency: '20.8 Hz',
    badge: 'للعناية الفموية الشاملة',
    target: 'تنظيف الفواصل والجيوب اللثوية',
    desc: 'ضغط مائي قياسي عالي الكفاءة (100 PSI) يخترق الجيوب اللثوية والمسامات الدقيقة بعمق لتنظيف شامل يوصي به أطباء الأسنان.',
  },
  {
    id: 'pulse',
    name: 'الوضع النبضي (Pulse)',
    psi: 120,
    pulses: 1300,
    frequency: '21.6 Hz',
    badge: 'تدليك وتنشيط اللثة',
    target: 'تنشيط الدورة الدموية ومقاومة الالتهاب',
    desc: 'نبضات مائية متتابعة ومتناوبة (120 PSI) تعمل على تدليك اللثة وتنشيط الدورة الدموية لمنع انحسار اللثة وتقوية دعامة الأسنان.',
  },
  {
    id: 'diy',
    name: 'الوضع القوي (Super DIY)',
    psi: 140,
    pulses: 1400,
    frequency: '23.3 Hz',
    badge: 'لأصحاب التقويم والزراعة',
    target: 'أطواق التقويم، الجسور، وزراعة الأسنان',
    desc: 'أقصى ضغط هيدروليكي فائق (140 PSI) يفتت أصعب الترسبات وحصى البلاك العالقة حول أسلاك وحلقات التقويم والتي يصعب الوصول إليها.',
  },
]

export function WaterSimulator() {
  const [activeIdx, setActiveIdx] = useState(2) // Default Normal mode (100 PSI)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const activeMode = simulatorModes[activeIdx]

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  return (
    <div className="rounded-[2.5rem] border-2 border-cyan-500/30 bg-gradient-to-b from-slate-950 via-brand-950 to-slate-950 p-6 shadow-[0_0_70px_rgba(6,182,212,0.15)] text-white sm:p-10">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/50 bg-cyan-950/80 px-4 py-1.5 text-xs font-black text-cyan-300 shadow-md">
          <Zap className="size-4 text-cyan-400 animate-pulse" />
          <span>عرض توضيحي لقوة الضخ والأوضاع الخمسة</span>
        </div>
        <h3 className="mt-4 text-2xl font-black sm:text-3xl text-white">
          شاهد جهاز <span className="text-cyan-400">H2O Floss</span> أثناء الضخ الفعلي
        </h3>
        <p className="mt-2 text-xs sm:text-sm text-slate-300">
          استكشف الأوضاع الخمسة المتدرجة (من 40 إلى 140 PSI) وشاهد طريقة الاستخدام وتدفق الماء الحقيقي.
        </p>
      </div>

      {/* Main Grid: Video Player + Mode Switcher */}
      <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:items-center">
        {/* Left: Real HD Video Player with Controls */}
        <div className="lg:col-span-7 relative">
          <div className="relative overflow-hidden rounded-3xl border-2 border-slate-800 bg-slate-900 shadow-2xl">
            {/* Live Mode HUD Badge Overlay */}
            <div className="absolute top-4 start-4 z-20 flex items-center gap-2 rounded-2xl border border-cyan-400/60 bg-slate-950/80 px-3.5 py-1.5 backdrop-blur-md">
              <Gauge className="size-4 text-cyan-400" />
              <span className="text-xs font-black text-white ltr-nums">{activeMode.psi} PSI</span>
              <span className="text-[10px] text-cyan-300 font-bold ltr-nums">({activeMode.pulses} نبضة/د)</span>
            </div>

            {/* Video Element */}
            <video
              ref={videoRef}
              src="/video/product-demo.mp4"
              poster="/images/h2ofloss-device-main.jpg"
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="w-full aspect-video object-cover"
            />

            {/* Bottom Floating Video Controls Bar */}
            <div className="absolute bottom-4 inset-x-4 z-20 flex items-center justify-between rounded-2xl bg-slate-950/70 p-2.5 backdrop-blur-md border border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="flex size-8 items-center justify-center rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors"
                >
                  {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 ms-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={toggleMute}
                  className="flex size-8 items-center justify-center rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                </button>
              </div>

              <div className="text-[11px] font-bold text-slate-300">
                <span>فيديو توضيحي حي للأداء الحقيقي</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Interactive 5-Mode Switcher Cards */}
        <div className="lg:col-span-5 space-y-3">
          {simulatorModes.map((m, idx) => {
            const isActive = activeIdx === idx
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={`w-full text-start rounded-2xl p-4 transition-all flex items-center justify-between border-2 ${
                  isActive
                    ? 'border-cyan-400 bg-gradient-to-r from-brand-900 to-cyan-950 shadow-lg shadow-cyan-500/20 scale-[1.02]'
                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-black ${isActive ? 'text-cyan-300' : 'text-white'}`}>
                      {m.name}
                    </span>
                    <span className="rounded-full bg-cyan-950 px-2 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-800/80">
                      {m.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-sm">{m.desc}</p>
                </div>

                <div className="shrink-0 text-end ps-3">
                  <div className="text-lg font-black text-white ltr-nums">
                    {m.psi} <span className="text-[10px] text-cyan-300 font-bold">PSI</span>
                  </div>
                  <div className="text-[10px] text-slate-400 ltr-nums">{m.pulses} نبضة/د</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

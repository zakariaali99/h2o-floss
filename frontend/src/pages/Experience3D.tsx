import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BatteryCharging,
  Droplets,
  Gauge,
  Layers,
  Minus,
  Package,
  Plus,
  RotateCcw,
  RotateCw,
  ShoppingBag,
  Sparkles,
  Zap,
} from 'lucide-react'

import { H2OFloss3DCanvas } from '../components/3d/H2OFloss3DCanvas'
import { ThemeToggle } from '../components/layout/ThemeToggle'

const modes3D = [
  { id: 'soft', name: 'اللطيف (Soft)', psi: 40, pulses: 1000, flow: '160 مل/د', badge: 'للأسنان الحساسة', desc: 'ضخ مائي لطيف 40 PSI يدلك أنسجة اللثة الحساسة للمبتدئين.' },
  { id: 'medium', name: 'المتوسط (Medium)', psi: 70, pulses: 1150, flow: '210 مل/د', badge: 'تنظيف يومي', desc: 'تدفق مائي متوازن 70 PSI لإزالة بقايا الطعام والبلاك.' },
  { id: 'normal', name: 'القياسي (Normal)', psi: 100, pulses: 1250, flow: '260 مل/د', badge: 'العناية الشاملة', desc: 'ضغط قياسي 100 PSI لتنظيف الجيوب اللثوية والمسامات بعمق.' },
  { id: 'pulse', name: 'النبضي (Pulse)', psi: 120, pulses: 1300, flow: '280 مل/د', badge: 'تدليك اللثة', desc: 'نبضات مائية متتابعة 120 PSI لتنشيط الدورة الدموية ومقاومة الالتهاب.' },
  { id: 'diy', name: 'القوي (Super DIY)', psi: 140, pulses: 1400, flow: '320 مل/د', badge: 'تقويم وزراعة', desc: 'أقصى ضغط مائي 140 PSI مخصص لأصحاب التقويم والزراعة والجسور.' },
]

export function Experience3DPage() {
  const [activeIdx, setActiveIdx] = useState(2) // Default Normal (100 PSI)
  const [autoRotate, setAutoRotate] = useState(true)
  const [isSpraying, setIsSpraying] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(0) // -3 to +3
  const [cameraPreset, setCameraPreset] = useState<'all' | 'nozzle' | 'buttons' | 'tank'>('all')
  const [isDark, setIsDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  )

  // Listen to dark class changes on <html>
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const activeMode = modes3D[activeIdx]

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 1.2, 3.6))
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 1.2, -3.0))
  }

  const handleResetZoom = () => {
    setZoomLevel(0)
    setCameraPreset('all')
    setAutoRotate(true)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-white selection:bg-cyan-500 selection:text-slate-950 pb-24">
      {/* 1. TOP NAVBAR (THEME AWARE) */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl px-3 py-2.5 sm:px-8 sm:py-3.5 transition-colors dark:border-slate-800/80 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:border-brand-500 hover:text-brand-900 transition-all shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:text-white"
            >
              <ArrowRight className="size-3.5" />
              <span className="hidden sm:inline">العودة للمتجر</span>
              <span className="sm:hidden">المتجر</span>
            </Link>

            <div className="flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-black text-brand-900 dark:border-cyan-500/40 dark:bg-cyan-950/60 dark:text-cyan-300">
              <Sparkles className="size-3 text-brand-600 dark:text-cyan-400" />
              <span>مختبر 3D</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle (Light / Dark Mode) */}
            <ThemeToggle />

            {/* Spray Toggle Button */}
            <button
              type="button"
              onClick={() => setIsSpraying(!isSpraying)}
              className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all ${
                isSpraying
                  ? 'border-brand-600 bg-brand-600 text-white font-black shadow-md dark:border-cyan-400 dark:bg-cyan-500 dark:text-slate-950'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              <Droplets className={`size-3.5 ${isSpraying ? 'animate-bounce' : ''}`} />
              <span>{isSpraying ? 'الرش نشط' : 'إيقاف الرش'}</span>
            </button>

            <Link
              to="/product/h2o-floss"
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-700 to-brand-900 px-4 py-1.5 text-xs font-black text-white shadow-md hover:scale-105 active:scale-95 transition-all dark:from-cyan-500 dark:to-sky-600 dark:text-slate-950"
            >
              <ShoppingBag className="size-3.5" />
              <span>225 د.ل</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. 3D HERO INTERACTIVE STAGE */}
      <section className="relative mx-auto max-w-7xl px-3 sm:px-6 pt-3 sm:pt-6">
        <div className="relative overflow-hidden rounded-3xl sm:rounded-[2.5rem] border border-slate-200 bg-white shadow-xl transition-colors dark:border-cyan-500/30 dark:bg-gradient-to-b dark:from-slate-900/90 dark:to-slate-950 dark:shadow-[0_0_80px_rgba(6,182,212,0.12)]">
          {/* Top Bar inside 3D Card */}
          <div className="flex items-center justify-between gap-3 p-3 sm:p-5 border-b border-slate-200/80 bg-slate-100/60 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/70">
            {/* Live PSI Stat: Fixed Width */}
            <div className="flex items-center">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3.5 py-1.5 w-[210px] sm:w-[230px] justify-between shadow-xs dark:border-cyan-500/40 dark:bg-slate-900/90">
                <div className="flex items-center gap-1.5">
                  <Gauge className="size-4 text-brand-600 dark:text-cyan-400 shrink-0" />
                  <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white ltr-nums whitespace-nowrap">{activeMode.psi} PSI</span>
                </div>
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] text-brand-900 border border-brand-200 font-mono truncate dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800/80">
                  {activeMode.badge}
                </span>
              </div>
            </div>

            {/* Controls: Zoom In / Out / Reset + Auto-Rotate */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-full border border-slate-300 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900/90">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="flex size-7 sm:size-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-brand-600 hover:text-white transition-colors dark:bg-slate-800 dark:text-cyan-300 dark:hover:bg-cyan-500 dark:hover:text-slate-950"
                  title="تكبير (Zoom In)"
                >
                  <Plus className="size-3.5 sm:size-4" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="flex size-7 sm:size-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-brand-600 hover:text-white transition-colors dark:bg-slate-800 dark:text-cyan-300 dark:hover:bg-cyan-500 dark:hover:text-slate-950"
                  title="تصغير (Zoom Out)"
                >
                  <Minus className="size-3.5 sm:size-4" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="flex size-7 sm:size-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
                  title="إعادة ضبط (Reset)"
                >
                  <RotateCcw className="size-3 sm:size-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setAutoRotate(!autoRotate)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                  autoRotate
                    ? 'border-brand-600 bg-brand-50 text-brand-900 dark:border-cyan-400 dark:bg-cyan-950/80 dark:text-cyan-300'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <RotateCw className={`size-3 ${autoRotate ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">{autoRotate ? 'إيقاف الدوران' : 'تدوير تلقائي'}</span>
              </button>
            </div>
          </div>

          {/* 3D Canvas Viewport */}
          <div className="h-[52vh] sm:h-[65vh] w-full relative">
            <H2OFloss3DCanvas
              psi={activeMode.psi}
              modeIndex={activeIdx}
              isSpraying={isSpraying}
              autoRotate={autoRotate}
              zoomLevel={zoomLevel}
              cameraPreset={cameraPreset}
              isDark={isDark}
            />

            {/* Quick Camera Angle Buttons CENTERED IN THE MIDDLE */}
            <div className="absolute bottom-4 inset-x-0 mx-auto w-fit z-10 flex items-center justify-center gap-1 sm:gap-1.5 rounded-full border border-slate-300 bg-white/90 px-3 py-1.5 backdrop-blur-md shadow-lg dark:border-slate-800 dark:bg-slate-950/85">
              <button
                type="button"
                onClick={() => {
                  setCameraPreset('all')
                  setZoomLevel(0)
                }}
                className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all ${
                  cameraPreset === 'all'
                    ? 'bg-brand-700 text-white font-black shadow-xs dark:bg-cyan-500 dark:text-slate-950'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                👁️ شامل
              </button>
              <button
                type="button"
                onClick={() => {
                  setCameraPreset('nozzle')
                  setZoomLevel(0)
                  setAutoRotate(false)
                }}
                className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all ${
                  cameraPreset === 'nozzle'
                    ? 'bg-brand-700 text-white font-black shadow-xs dark:bg-cyan-500 dark:text-slate-950'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                💧 الفوهة
              </button>
              <button
                type="button"
                onClick={() => {
                  setCameraPreset('buttons')
                  setZoomLevel(0)
                  setAutoRotate(false)
                }}
                className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all ${
                  cameraPreset === 'buttons'
                    ? 'bg-brand-700 text-white font-black shadow-xs dark:bg-cyan-500 dark:text-slate-950'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                🔘 الأزرار
              </button>
              <button
                type="button"
                onClick={() => {
                  setCameraPreset('tank')
                  setZoomLevel(0)
                  setAutoRotate(false)
                }}
                className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold transition-all ${
                  cameraPreset === 'tank'
                    ? 'bg-brand-700 text-white font-black shadow-xs dark:bg-cyan-500 dark:text-slate-950'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                🌊 الخزان
              </button>
            </div>
          </div>

          {/* 3D Mode Selector Dock */}
          <div className="border-t border-slate-200/80 bg-slate-50/90 p-3 sm:p-5 dark:border-slate-800 dark:bg-slate-950/95">
            <div className="flex items-center justify-between pb-2 text-[10px] sm:text-xs text-slate-500 font-bold dark:text-slate-400">
              <span>اختر وضع الضغط للتحكم بالرذاذ:</span>
              <span className="text-brand-700 font-mono ltr-nums dark:text-cyan-400">{activeMode.pulses} نبضة/د</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
              {modes3D.map((m, idx) => {
                const isActive = activeIdx === idx
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActiveIdx(idx)}
                    className={`rounded-2xl p-2.5 sm:p-3 text-start transition-all flex flex-col justify-between border-2 ${
                      isActive
                        ? 'border-brand-600 bg-brand-50 text-brand-900 shadow-md scale-[1.02] dark:border-cyan-400 dark:bg-gradient-to-b dark:from-cyan-950 dark:to-brand-950 dark:text-white'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-[11px] sm:text-xs font-black truncate ${isActive ? 'text-brand-900 dark:text-cyan-300' : 'text-slate-800 dark:text-white'}`}>
                        {m.name}
                      </span>
                      <span className={`text-[10px] sm:text-xs font-black ltr-nums shrink-0 ${isActive ? 'text-brand-700 dark:text-white' : 'text-brand-600 dark:text-cyan-400'}`}>
                        {m.psi} PSI
                      </span>
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">{m.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 3. TECHNICAL SPECIFICATIONS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3.5 py-1 text-xs font-bold text-brand-900 border border-brand-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800">
            <Zap className="size-3.5" />
            <span>تفاصيل الابتكار الهندسي</span>
          </div>
          <h2 className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            مواصفات جهاز <span className="text-brand-700 dark:text-cyan-400">H2O Floss</span> بدقة
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            صُمم لتقديم أقصى درجات العناية بالأسنان واللثة مع سهولة الاستخدام اليومي.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Card 1 */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:backdrop-blur-md">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 mb-4 dark:bg-cyan-950 dark:border-cyan-800/80 dark:text-cyan-400">
              <Droplets className="size-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">فوهة الرش المنحنية 45°</h3>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              تصل نبضات الماء إلى 1400 نبضة/دقيقة بقطر رذاذ دقيق 0.6 ملم لتنظيف الجيوب اللثوية وتفتيت 99.9% من البلاك حول الأسنان وأسلاك التقويم.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:backdrop-blur-md">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 mb-4 dark:bg-cyan-950 dark:border-cyan-800/80 dark:text-cyan-400">
              <Layers className="size-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">خزان 300 مل + كرة الجاذبية 360°</h3>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              أنبوب سيليكون مرن مزود بكرة ثقل معدنية تتحرك مع حركة يدك لضمان تدفق الماء المستمر حتى عند إمالة الجهاز بزاوية مائلة أو مقلوبة.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:backdrop-blur-md">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 mb-4 dark:bg-cyan-950 dark:border-cyan-800/80 dark:text-cyan-400">
              <BatteryCharging className="size-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">بطارية 2500 mAh تدوم 15-20 يوماً</h3>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              شحنة واحدة تكفي للاستخدام اليومي وتدوم ما بين 15 إلى 20 يوماً متواصلة، مع معيار IPX7 المقاوم للماء بالكامل للاستخدام الآمن أثناء الاستحمام.
            </p>
          </div>
        </div>
      </section>

      {/* 4. FINAL ORDER CTA BANNER */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pt-16">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-brand-50 via-slate-100 to-brand-50 p-8 sm:p-10 text-center shadow-lg dark:border-2 dark:border-cyan-500/40 dark:bg-gradient-to-r dark:from-slate-900 dark:via-brand-950 dark:to-slate-900 dark:shadow-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-4 py-1.5 text-xs font-black text-brand-900 border border-brand-300 mb-4 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800">
            <Package className="size-4" />
            <span>الباقة الأصلية المتكاملة مع 6 فوهات</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            احصل على جهاز <span className="text-brand-700 dark:text-cyan-400">H2O Floss</span> الآن
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
            توصيل سريع لكافة المدن الليبية، الدفع عند الاستلام بعد المعاينة، وضمان استبدال رسمي لسنتين.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/product/h2o-floss"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-700 to-brand-900 px-8 py-3.5 text-sm font-black text-white shadow-lg hover:scale-105 active:scale-95 transition-all dark:from-cyan-500 dark:to-sky-600 dark:text-slate-950 dark:shadow-cyan-500/30"
            >
              <ShoppingBag className="size-4" />
              <span>طلب الجهاز الآن (225 د.ل)</span>
            </Link>
            <Link
              to="/"
              className="w-full sm:w-auto rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-white"
            >
              تصفح المتجر
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Wrench } from 'lucide-react'

const nozzlesList = [
  {
    id: 'classic',
    name: '2× الفوهة الكلاسيكية (Standard)',
    useCase: 'التنظيف الفموي اليومي لإزالة البلاك وتفتيت بقايا الطعام.',
    sprayPattern: 'ضخ مائي حاد ودقيق بدرجة 360° بين الفواصل.',
    target: 'الأسنان الطبيعية واللثة السليمة',
    count: '2 قطعة',
    badge: 'استخدام يومي',
    image: '/images/nozzles/nozzle-standard.jpg',
  },
  {
    id: 'ortho',
    name: '1× فوهة التقويم (Orthodontic)',
    useCase: 'شعيرات دقيقة خاصة تنظف ما حول أسلاك وحلقات التقويم بمهارة.',
    sprayPattern: 'ضخ مزدوج مع فرك الشعيرات للحواف المعدنية.',
    target: 'أصحاب تقويم الأسنان المعدني والشفاف',
    count: '1 قطعة',
    badge: 'حماية التقويم',
    image: '/images/nozzles/nozzle-orthodontic.jpg',
  },
  {
    id: 'perio',
    name: '1× فوهة الجيوب والتركيبات (Periodontal)',
    useCase: 'رأس مطاطي ناعم يدخل الجيوب اللثوية والتركيبات الثابتة بأمان.',
    sprayPattern: 'ضخ مائي فائق اللطف والنعومة لمنع النزيف.',
    target: 'مرضى الجيوب اللثوية وجسور الأسنان',
    count: '1 قطعة',
    badge: 'عناية باللثة',
    image: '/images/nozzles/nozzle-periodontal.jpg',
  },
  {
    id: 'tongue',
    name: '1× مكشطة اللسان (Tongue Cleaner)',
    useCase: 'تصميم ملعقة صغيرة تجرف الطبقة البكتيرية وتمنح نفساً عطراً.',
    sprayPattern: 'تدفق رغوي يطهر فتحات المسامات اللسانية.',
    target: 'إزالة بكتيريا اللسان ونفس طازج',
    count: '1 قطعة',
    badge: 'نفس منعش',
    image: '/images/nozzles/nozzle-tongue.jpg',
  },
  {
    id: 'brush',
    name: '1× رأس الفرشاة المائية (Toothbrush Tip)',
    useCase: 'تدمج بين الحك بالفرشاة والضخ المائي المباشر بنفس اللحظة.',
    sprayPattern: 'ضخ مائي متزامن مع حركة شعيرات الفرشاة.',
    target: 'تنظيف وتلميع سطح الأسنان',
    count: '1 قطعة',
    badge: 'عمل مزدوج',
    image: '/images/nozzles/nozzle-toothbrush.jpg',
  },
  {
    id: 'nasal',
    name: '1× فوهة الجيوب الأنفية (Nasal Tip)',
    useCase: 'رأس سيليكون ناعم لغسيل وتطهير الجيوب الأنفية بالرذاذ الطبيعي.',
    sprayPattern: 'رذاذ مائي متدرج لتنظيف الممرات التنفسية بلطف.',
    target: 'تنظيف الجيوب الأنفية والترطيب',
    count: '1 قطعة',
    badge: 'جيوب أنفية',
    image: '/images/nozzles/nozzle-nasal.jpg',
  },
]

export function NozzleExplorer() {
  const [activeIdx, setActiveIdx] = useState(0)
  const activeNozzle = nozzlesList[activeIdx]

  return (
    <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-10">
      <div className="text-center max-w-xl mx-auto">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3.5 py-1 text-xs font-bold text-brand-800 dark:bg-slate-800 dark:text-cyan-300">
          <Wrench className="size-3.5" />
          <span>مختبر الرؤوس والفوهات المخصصة (6 قطع)</span>
        </span>
        <h3 className="mt-4 text-2xl font-black sm:text-3xl text-slate-900 dark:text-white">
          اكتشف وظائف الفوهات المرفقة مع الجهاز
        </h3>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          انقر على أي فوهة للتعرف على استخداماتها الفموية الخاصة وخصائص تدفقها.
        </p>
      </div>

      {/* Tabs list */}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {nozzlesList.map((n, idx) => {
          const isActive = activeIdx === idx
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-brand-800 text-white shadow-md shadow-brand-900/20 dark:bg-cyan-500 dark:text-slate-950'
                  : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {n.badge}
            </button>
          )
        })}
      </div>

      {/* Active Nozzle Showcase Card */}
      <motion.div
        key={activeNozzle.id}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-8 rounded-3xl border border-slate-200/80 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950 sm:p-8"
      >
        <div className="grid gap-6 sm:grid-cols-12 items-center">
          <div className="sm:col-span-4 text-center">
            <div className="mx-auto size-32 sm:size-36 rounded-3xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-800 dark:bg-slate-900 flex items-center justify-center overflow-hidden group">
              <img
                src={activeNozzle.image}
                alt={activeNozzle.name}
                className="size-full object-contain transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <span className="mt-3 inline-block rounded-full bg-slate-200 px-3.5 py-0.5 text-xs font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
              العدد: {activeNozzle.count}
            </span>
          </div>

          <div className="sm:col-span-8 space-y-3">
            <div className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-800 dark:bg-slate-800 dark:text-cyan-300">
              {activeNozzle.badge}
            </div>

            <h4 className="text-xl font-bold text-slate-900 dark:text-white">
              {activeNozzle.name}
            </h4>

            <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {activeNozzle.useCase}
            </p>

            <div className="grid gap-2 text-xs pt-2 border-t border-slate-200 dark:border-slate-800 sm:grid-cols-2">
              <div>
                <span className="text-slate-400">نمط التدفق:</span>{' '}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {activeNozzle.sprayPattern}
                </span>
              </div>
              <div>
                <span className="text-slate-400">المستهدف:</span>{' '}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {activeNozzle.target}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

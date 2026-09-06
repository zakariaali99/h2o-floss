import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Award,
  Banknote,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Droplets,
  Gauge,
  HelpCircle,
  MessageCircle,
  Play,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  Zap,
} from 'lucide-react'

import { HydroBubbleCanvas } from '../components/graphics/HydroBubbleCanvas'
import { NozzleExplorer } from '../components/widgets/NozzleExplorer'
import { catalogApi } from '../api/catalog'
import { ordersApi } from '../api/orders'
import { useCartStore } from '../features/cart/store'
import type { ProductCard } from '../api/types'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
}

// 6 Core Engineered Features
const features = [
  {
    icon: Gauge,
    title: '5 أوضاع ضغط ذكية (40 - 140 PSI)',
    desc: 'من التدليك اللطيف للثة الحساسة إلى الضخ المركز لتنظيف التقويم والتركيبات بعمق فائق.',
    badge: 'تحكم دقيق',
  },
  {
    icon: Droplets,
    title: 'خزان سعة 300 مل + كرة جاذبية 360°',
    desc: 'أنبوب مرن يسحب الماء من أي زاوية حتى عند إمالة الجهاز بزاوية مائلة أو مقلوبة بالكامل.',
    badge: 'تصميم براءة اختراع',
  },
  {
    icon: Zap,
    title: 'بطارية 2500 mAh تدوم 15-20 يوماً',
    desc: 'شحنة واحدة عبر USB تكفي للاستخدام اليومي وتدوم ما بين 15 إلى 20 يوماً متواصلة.',
    badge: 'شحن USB عالمي',
  },
  {
    icon: ShieldCheck,
    title: 'مقاوم للماء IPX7 للاستخدام أثناء الاستحمام',
    desc: 'هيكل معزول بالكامل يتيح لك غسل الجهاز بالماء واستخدامه بأمان داخل الحمام.',
    badge: 'معيار عزل دولي',
  },
  {
    icon: Sparkles,
    title: '6 فوهات متخصصة لكل الاستخدامات',
    desc: 'تشمل فوهات كلاسيكية، رأس تنظيف التقويم، رأس الجيوب اللثوية، منظف اللسان، ورأس الأنف.',
    badge: 'طقم متكامل',
  },
  {
    icon: RotateCcw,
    title: 'تصميم مريح مع فوهة تدور 360 درجة',
    desc: 'رأس دوار بالكامل مع زر تحرير سريع يضمن وصول نبضات الماء لأصعب الزوايا والأسنان الخلفية.',
    badge: 'راحة تامة',
  },
]

// FAQ Items
const faqs = [
  {
    q: 'كيف تتم عملية الدفع والتوصيل؟',
    a: 'التوصيل سريع لكافة مدن ومناطق ليبيا خلال 24-48 ساعة. الدفع يكون نقداً (كاش) عند الاستلام بعد معاينة وفحص الجهاز مع مندوب التوصيل. كما يمكنك الدفع عبر تحويل مصرفي من خلال واتساب.',
  },
  {
    q: 'هل جهاز H2O Floss مناسب لأصحاب تقويم الأسنان والزراعة؟',
    a: 'نعم تماماً! الجهاز يأتي مع رأس مخصص للتقويم (Orthodontic Tip) لتنظيف الأسلاك والأطواق، بالإضافة لرأس الجيوب اللثوية والتركيبات لضمان تنظيف مائي لطيف وفعال دون أي ضرر.',
  },
  {
    q: 'كم تدوم شحنة البطارية وكيف يتم شحنها؟',
    a: 'يحتوي الجهاز على بطارية ليثيوم بسعة 2500 mAh تدوم ما بين 15 إلى 20 يوماً من الاستخدام المنتظم. يتم شحنها بسهولة عبر كابل USB المرفق مع أي شاحن هاتف أو بنك طاقة.',
  },
  {
    q: 'ما هي الملحقات المرفقة في العلبة الأصلية؟',
    a: 'تحتوي العلبة على الجهاز الرئيسي، 6 فوهات متخصصة لمختلف الاحتياجات، كابل شحن USB، ودليل الاستخدام الكامل.',
  },
]

export function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const addItem = useCartStore((state) => state.addItem)
  const navigate = useNavigate()

  // Live catalog + store settings so the landing page reflects dashboard edits.
  const { data: featured } = useQuery({
    queryKey: ['home-featured'],
    queryFn: () => catalogApi.getProducts({ featured: true }),
    staleTime: 60000,
  })
  const liveProduct = featured?.results?.find((p) => p.kind === 'DEVICE') || featured?.results?.[0]

  const { data: storeCfg } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => ordersApi.getStoreSettings(),
    staleTime: 60000,
  })

  const fallbackProduct: ProductCard = {
    id: 1,
    name: 'جهاز الخيط المائي H2O Floss الأصلي المطور',
    slug: 'h2o-floss',
    tagline: 'الجهاز الأصلي المعتمد بخمسة أوضاع ذكية',
    kind: 'DEVICE',
    price: '225.00',
    old_price: '275.00',
    currency: 'د.ل',
    discount_percent: 18,
    main_image: '/images/h2ofloss-device-main.jpg',
    category: { slug: 'devices', name: 'الأجهزة الرئيسية' },
    in_stock: true,
    is_featured: true,
    views_count: 240,
    badge: 'الأكثر طلباً',
  }
  const heroProduct: ProductCard = liveProduct ?? fallbackProduct
  const heroPrice = Math.round(parseFloat(heroProduct.price))
  const heroOldPrice = heroProduct.old_price ? Math.round(parseFloat(heroProduct.old_price)) : null

  const handleBuyNow = () => {
    addItem(heroProduct, 1)
    navigate('/cart')
  }

  const whatsappNumber = storeCfg?.store_whatsapp || '218910000000'
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
    'السلام عليكم، أرغب بالحصول على جهاز H2O Floss للتنظيف المائي والدفع عند الاستلام.',
  )}`

  return (
    <div className="overflow-hidden">
      {/* SECTION 1: DRAMATIC HERO WITH AMBIENT LIGHTING & ANIMATED HYDRO BUBBLES */}
      <section className="relative min-h-[90vh] flex items-center py-20 lg:py-28 overflow-hidden bg-radial from-brand-50/50 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
        {/* Animated Water Bubbles & Fluid Wave Canvas */}
        <HydroBubbleCanvas />

        <div className="absolute -top-40 start-1/2 -translate-x-1/2 size-[600px] rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Right Text Column */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="order-2 lg:order-1 lg:col-span-7 z-10"
            >
              <motion.div variants={fadeInUp}>
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-50/80 px-4 py-1.5 text-xs font-bold text-brand-900 shadow-sm backdrop-blur-md dark:border-cyan-500/30 dark:bg-cyan-950/60 dark:text-cyan-300">
                  <Sparkles className="size-3.5 text-brand-600 dark:text-cyan-400" />
                  <span>الجيل الأحدث لتنظيف الفم والأسنان المائي</span>
                </span>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="mt-6 text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white"
              >
                ابتسامة ناصعة وصحة لثة مثالية مع{' '}
                <span className="bg-gradient-to-r from-brand-700 via-sky-600 to-cyan-500 bg-clip-text text-transparent dark:from-cyan-400 dark:via-sky-300 dark:to-cyan-200">
                  H2O Floss الأصلي
                </span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="mt-5 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300 max-w-xl"
              >
                جهاز الخيط المائي المطور بقوة ضخ 140 PSI و5 أوضاع ذكية يزيل 99.9% من البلاك والبقايا في الأماكن التي لا
                تصل إليها الفرشاة التقليدية.
              </motion.p>

              {/* Price Tag & Guarantees Pill */}
              <motion.div
                variants={fadeInUp}
                className="mt-8 flex flex-wrap items-center gap-4 rounded-3xl border border-cyan-500/30 bg-white/80 p-4.5 shadow-xl shadow-cyan-500/10 backdrop-blur-md dark:border-cyan-900/50 dark:bg-slate-900/90"
              >
                <div className="flex items-baseline gap-1.5 px-3">
                  <span className="text-3xl font-black text-brand-900 dark:text-white ltr-nums">{heroPrice}</span>
                  <span className="text-sm font-bold text-brand-700 dark:text-cyan-300">د.ل</span>
                  {heroOldPrice && (
                    <span className="text-sm text-slate-400 line-through ms-2 ltr-nums">{heroOldPrice} د.ل</span>
                  )}
                </div>

                <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 px-2">
                  <CheckCircle2 className="size-4" />
                  <span>توصيل لكافة المدن الليبية · كاش عند الاستلام أو تحويل مصرفي عبر واتساب</span>
                </div>
              </motion.div>

              {/* CTA Action Buttons */}
              <motion.div
                variants={fadeInUp}
                className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center w-full sm:w-auto"
              >
                <Link
                  to="/product/h2o-floss"
                  className="group relative inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-brand-800 to-brand-900 px-8 py-4 text-base font-bold text-white shadow-xl shadow-brand-900/30 transition-all hover:scale-105 active:scale-95 dark:from-brand-600 dark:to-cyan-600"
                >
                  <ShoppingBag className="size-5 transition-transform group-hover:-translate-y-0.5" />
                  <span>اطلب الآن — الدفع عند الاستلام (كاش)</span>
                </Link>

                <a
                  href="#demo-video"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white/90 px-6 py-4 text-sm font-bold text-slate-700 shadow-sm backdrop-blur-md transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Play className="size-4 text-brand-600 dark:text-cyan-400" />
                  <span>مشاهدة فيديو التجربة</span>
                </a>
              </motion.div>
            </motion.div>

            {/* Left Product Hero Stage with Floating 3D Spec Badges */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="order-1 lg:order-2 mb-6 lg:mb-0 lg:col-span-5 relative"
            >
              <div className="relative mx-auto max-w-md overflow-hidden rounded-[2.5rem] border border-cyan-500/30 bg-gradient-to-b from-white via-slate-50 to-cyan-50/30 p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
                {/* Floating Top Badge */}
                <div className="absolute top-6 start-6 z-10">
                  <span className="rounded-full bg-brand-800 px-3.5 py-1 text-xs font-bold text-white shadow-md">
                    الأصلي 100%
                  </span>
                </div>

                {/* FLOATING 3D GLASS BADGE 1: 140 PSI */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute top-10 end-4 z-20 rounded-2xl border-2 border-cyan-500 bg-white/95 px-4 py-2.5 shadow-xl shadow-cyan-500/20 backdrop-blur-md dark:border-cyan-400/60 dark:bg-slate-900/90"
                >
                  <div className="flex items-center gap-1.5 text-xs font-black text-brand-900 dark:text-cyan-300">
                    <Gauge className="size-4 text-cyan-600 dark:text-cyan-400" />
                    <span className="ltr-nums">140 PSI</span>
                  </div>
                  <span className="block text-[9px] font-extrabold text-brand-700 dark:text-slate-400">ضغط هيدروليكي</span>
                </motion.div>

                {/* FLOATING 3D GLASS BADGE 2: 300 ML TANK */}
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  className="absolute bottom-20 start-4 z-20 rounded-2xl border-2 border-cyan-500 bg-white/95 px-4 py-2.5 shadow-xl shadow-cyan-500/20 backdrop-blur-md dark:border-cyan-400/60 dark:bg-slate-900/90"
                >
                  <div className="flex items-center gap-1.5 text-xs font-black text-brand-900 dark:text-cyan-300">
                    <Droplets className="size-4 text-cyan-600 dark:text-cyan-400" />
                    <span className="ltr-nums">300 ml</span>
                  </div>
                  <span className="block text-[9px] font-extrabold text-brand-700 dark:text-slate-400">خزان شفاف</span>
                </motion.div>

                {/* FLOATING 3D GLASS BADGE 3: IPX7 */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  className="absolute bottom-10 end-6 z-20 rounded-2xl border-2 border-emerald-500 bg-white/95 px-4 py-2.5 shadow-xl shadow-emerald-500/20 backdrop-blur-md dark:border-emerald-400/60 dark:bg-slate-900/90"
                >
                  <div className="flex items-center gap-1.5 text-xs font-black text-brand-900 dark:text-cyan-300">
                    <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <span>IPX7</span>
                  </div>
                  <span className="block text-[9px] font-extrabold text-emerald-700 dark:text-slate-400">مقاوم للماء</span>
                </motion.div>

                {/* Product Image */}
                <img
                  src="/images/h2ofloss-device-main.jpg"
                  alt="H2O Floss Device"
                  className="mx-auto aspect-square w-full object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-105"
                />

                <div className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>طقم متكامل مع 6 فوهات</span>
                    <span className="text-emerald-600 dark:text-emerald-400">متوفر تسليم فوري</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 2: DECLUTTERED TRUST PILLARS BAR */}
      <section className="py-12 border-y border-slate-200/60 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              {
                icon: ShieldCheck,
                title: 'أصلي ومضمون 100%',
                desc: 'مطابق للمواصفات الطبية العالمية',
              },
              {
                icon: Truck,
                title: 'شحن سريع لكافة المدن',
                desc: 'توصيل خلال 24 إلى 48 ساعة',
              },
              {
                icon: Banknote,
                title: 'الدفع عند الاستلام كاش',
                desc: 'فحص ومعاينة الجهاز قبل السداد',
              },
              {
                icon: Award,
                title: 'جودة واعتماد عالمي',
                desc: 'شهادات السلامة الصحية والجودة',
              },
            ].map((pillar, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-800 dark:bg-slate-800 dark:text-cyan-300">
                  <pillar.icon className="size-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{pillar.title}</h4>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{pillar.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SECTION 3: SPACIOUS CORE FEATURES GRID (6 CARDS) */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3.5 py-1 text-xs font-bold text-brand-800 dark:bg-slate-800 dark:text-cyan-300">
              <Sparkles className="size-3.5" />
              <span>تقنيات هيدروليكية متطورة</span>
            </span>
            <h2 className="mt-4 text-3xl font-black text-slate-900 sm:text-4xl dark:text-white">
              لماذا يعتبر H2O Floss الأفضل عالمياً؟
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              صمم الجهاز لتقديم أقصى درجات النظافة الفموية والعناية باللثة بفضل الحلول الهندسيّة المبتكرة.
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((feat, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group flex flex-col justify-between rounded-[2rem] border border-cyan-500/20 bg-white p-8 shadow-xs transition-all hover:border-cyan-400 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-800 shadow-inner group-hover:bg-brand-800 group-hover:text-white transition-colors dark:bg-slate-800 dark:text-cyan-300 dark:group-hover:bg-brand-600">
                      <feat.icon className="size-7" />
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {feat.badge}
                    </span>
                  </div>

                  <h3 className="mt-6 text-lg font-bold text-slate-900 dark:text-white">
                    {feat.title}
                  </h3>
                  <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {feat.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>


      {/* SECTION 5: INTERACTIVE VIDEO SHOWCASE WITH AMBIENT GLOW */}
      <section id="demo-video" className="py-24 bg-slate-900 text-white relative">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-950/80 px-3.5 py-1 text-xs font-bold text-cyan-300 border border-cyan-800/50">
              <Play className="size-3.5" />
              <span>عرض توضيحي حي</span>
            </span>
            <h2 className="mt-4 text-3xl font-black sm:text-4xl text-white">
              شاهد قوة ضخ H2O Floss أثناء الاستخدام
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-300">
              طريقة الاستخدام السلسة والتحكم بالضغط لتنظيف شامل في دقيقة واحدة يومياً.
            </p>
          </div>

          <div className="mt-12 relative overflow-hidden rounded-[2.5rem] border border-cyan-500/40 bg-slate-950 p-2 sm:p-3 shadow-[0_0_60px_rgba(6,182,212,0.25)]">
            <video
              controls
              playsInline
              preload="auto"
              poster="/images/h2ofloss-device-main.jpg"
              className="w-full aspect-video rounded-[2rem] object-cover bg-black shadow-inner"
            >
              <source src="/video/product-demo.mp4" type="video/mp4" />
              متصفحك لا يدعم تشغيل الفيديو مباشرة.
            </video>
          </div>
        </div>
      </section>

      {/* SECTION 6: INTERACTIVE 6 NOZZLES EXPLORER WIDGET */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <NozzleExplorer />
        </div>
      </section>

      {/* SECTION 7: PAYMENT & DELIVERY */}
      <section className="py-16 sm:py-24 bg-slate-50/70 dark:bg-slate-900/40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold text-brand-700 dark:text-cyan-300">الدفع والتوصيل</span>
            <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-4xl dark:text-white">
              طرق دفع مرنة وتوصيل سريع لكل ليبيا
            </h2>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <Truck className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">التوصيل السريع</h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                التوصيل سريع لكافة مدن ومناطق ليبيا خلال 24-48 ساعة. الدفع يكون نقداً (كاش) عند الاستلام بعد معاينة وفحص
                الجهاز مع مندوب التوصيل.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-800 dark:bg-slate-800 dark:text-cyan-300">
                <CreditCard className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">طرق الدفع</h3>
              <ul className="mt-2 space-y-1.5 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <span>الدفع نقداً (كاش) عند الاستلام.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <span>كما يمكنك الدفع عبر تحويل مصرفي من خلال واتساب.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: FAQ INTERACTIVE ACCORDION */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-800 dark:bg-slate-800 dark:text-cyan-300">
              <HelpCircle className="size-6" />
            </span>
            <h2 className="mt-4 text-3xl font-black text-slate-900 dark:text-white">الأسئلة الشائعة</h2>
            <p className="mt-2 text-xs text-slate-500">إجابات شفافة على جميع استفسارات الشراء والضمان في ليبيا.</p>
          </div>

          <div className="mt-12 space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-white transition-all dark:border-slate-800 dark:bg-slate-900"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between p-6 text-start text-sm font-bold text-slate-900 dark:text-white"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`size-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-brand-600' : ''}`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 text-xs sm:text-sm leading-relaxed text-slate-600 border-t border-slate-100 pt-4 dark:border-slate-800 dark:text-slate-300 animate-in fade-in duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* SECTION 9: HIGH-IMPACT DIRECT CTA */}
      <section className="py-20 bg-gradient-to-r from-brand-900 via-brand-800 to-teal-900 text-white relative overflow-hidden">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 relative z-10">
          <h2 className="text-3xl font-black sm:text-4xl text-white">
            جاهز لتجربة العناية الفموية الفائقة؟
          </h2>
          <p className="mt-3 text-sm text-cyan-100 max-w-xl mx-auto">
            احصل على جهاز H2O Floss الأصلي المطور بسعر {heroPrice} د.ل فقط، مع الدفع نقداً عند الاستلام أو تحويل مصرفي عبر واتساب.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              type="button"
              onClick={handleBuyNow}
              className="flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-brand-950 shadow-xl transition-all hover:bg-cyan-50 active:scale-95 cursor-pointer"
            >
              <ShoppingBag className="size-4 text-brand-800" />
              <span>طلب الجهاز الآن (إضافة للسلة)</span>
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full border border-cyan-300/40 bg-white/10 px-6 py-4 text-sm font-bold text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/20"
            >
              <MessageCircle className="size-4 text-emerald-400" />
              <span>طلب عبر الواتساب الفوري</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

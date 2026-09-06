import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  CheckCircle2,
  Droplets,
  HelpCircle,
  Maximize2,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Truck,
  X,
} from 'lucide-react'

import { catalogApi } from '../api/catalog'
import { useCartStore } from '../features/cart/store'
import { ProductSkeleton } from '../components/ui/ProductSkeleton'

export function ProductDetailPage() {
  const { slug = 'h2o-floss' } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const addItem = useCartStore((state) => state.addItem)

  const [quantity, setQuantity] = useState(1)
  const [selectedImg, setSelectedImg] = useState<string | null>(null)
  const [zoomModalOpen, setZoomModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'shipping'>('desc')

  // Fetch product detail from DRF API
  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product-detail', slug],
    queryFn: () => catalogApi.getProduct(slug),
  })

  // Fire view beacon on mount (once per product view)
  useEffect(() => {
    if (slug) {
      catalogApi.recordProductView(slug).catch(() => {})
    }
  }, [slug])

  if (isLoading) {
    return <ProductSkeleton />
  }

  if (isError || !product) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-slate-800 dark:text-amber-400">
          <HelpCircle className="size-8" />
        </div>
        <h2 className="mt-4 text-2xl font-black text-slate-900 dark:text-white">المنتج غير موجود</h2>
        <p className="mt-2 text-xs text-slate-500">
          قد يكون الرابط غير صحيح أو تم إزالة المنتج من الكتالوج.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-800 px-6 py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-brand-700"
        >
          <span>العودة للرئيسية</span>
          <ArrowLeft className="size-4" />
        </Link>
      </div>
    )
  }

  // Gallery images list (main_image first + images gallery)
  const allImages = [
    ...(product.main_image ? [{ id: 0, image: product.main_image, caption: 'الرئيسية' }] : []),
    ...(product.images ?? []),
  ]

  const currentDisplayImg = selectedImg || product.main_image || '/images/h2ofloss-device-main.jpg'

  return (
    <div className="pb-24">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Link to="/" className="transition-colors hover:text-brand-600 dark:hover:text-cyan-300">
            الرئيسية
          </Link>
          <span>/</span>
          {product.category && (
            <>
              <Link
                to={`/parts?category=${product.category.slug}`}
                className="transition-colors hover:text-brand-600 dark:hover:text-cyan-300"
              >
                {product.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="truncate text-slate-900 dark:text-white">{product.name}</span>
        </nav>

        {/* Product Main Hero Grid */}
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Gallery Section */}
          <div className="flex flex-col gap-4 lg:col-span-6">
            {/* Featured Image Display */}
            <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <img
                src={currentDisplayImg}
                alt={product.name}
                className="mx-auto aspect-square w-full rounded-2xl object-contain transition-transform duration-300 group-hover:scale-105"
              />

              {/* Badge Overlay */}
              {product.badge && (
                <span className="absolute top-4 start-4 rounded-full bg-brand-800 px-3 py-1 text-xs font-bold text-white shadow-xs">
                  {product.badge}
                </span>
              )}

              {/* Zoom Trigger Button */}
              <button
                type="button"
                onClick={() => setZoomModalOpen(true)}
                aria-label="تكبير الصورة"
                className="absolute bottom-4 end-4 flex size-9 items-center justify-center rounded-xl bg-white/90 text-slate-700 shadow-md backdrop-blur-md transition-all hover:bg-white hover:text-slate-900 dark:bg-slate-800/90 dark:text-slate-200"
              >
                <Maximize2 className="size-4" />
              </button>
            </div>

            {/* Thumbnails Rail */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {allImages.map((imgItem, idx) => {
                  const isActive = currentDisplayImg === imgItem.image
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImg(imgItem.image)}
                      className={`relative size-20 shrink-0 overflow-hidden rounded-2xl border-2 bg-white p-1 transition-all ${
                        isActive
                          ? 'border-brand-600 ring-2 ring-brand-500/20 dark:border-cyan-400'
                          : 'border-slate-200 opacity-70 hover:opacity-100 dark:border-slate-800'
                      }`}
                    >
                      <img src={imgItem.image} alt="" className="size-full object-contain" />
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Product Details Column */}
          <div className="flex flex-col justify-between lg:col-span-6">
            <div>
              {/* Kind & Availability Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-800 dark:bg-slate-800 dark:text-cyan-300">
                  {product.kind === 'DEVICE'
                    ? 'جهاز الخيط المائي الأصلي'
                    : product.kind === 'PART'
                      ? 'قطعة غيار رسمية'
                      : 'ملحق تخصصي'}
                </span>

                {product.in_stock ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>متوفر في المخزن — تسليم فوري</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                    غير متوفر حالياً
                  </span>
                )}
              </div>

              {/* Title & Tagline */}
              <h1 className="mt-4 text-2xl font-black leading-tight text-slate-900 sm:text-3xl lg:text-4xl dark:text-white">
                {product.name}
              </h1>

              {product.tagline && (
                <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {product.tagline}
                </p>
              )}

              {/* Price & Savings Block */}
              <div className="mt-6 flex flex-wrap items-baseline gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-4.5 dark:border-slate-800 dark:bg-slate-800/60">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-brand-900 sm:text-4xl dark:text-white ltr-nums">
                    {Math.round(parseFloat(product.price))}
                  </span>
                  <span className="text-sm font-bold text-brand-700 dark:text-cyan-300">دينار ليبي</span>
                </div>

                {product.old_price && (
                  <span className="text-sm text-slate-400 line-through ltr-nums">
                    {Math.round(parseFloat(product.old_price))} د.ل
                  </span>
                )}

                {product.discount_percent > 0 && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    خصم {product.discount_percent}%
                  </span>
                )}

                <div className="w-full text-xs font-semibold text-slate-500 dark:text-slate-400">
                  ⚡ شحن وتوصيل لكافة المدن والمناطق في ليبيا · الدفع كاش عند الاستلام
                </div>
              </div>

              {/* Compatible Devices Banner (For Parts) */}
              {product.compatible_devices && product.compatible_devices.length > 0 && (
                <div className="mt-4 flex items-center justify-between rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4 dark:border-cyan-900/60 dark:bg-slate-800/90">
                  <div className="flex items-center gap-2.5">
                    <Droplets className="size-5 text-brand-700 dark:text-cyan-300" />
                    <div className="text-xs">
                      <span className="block font-bold text-slate-900 dark:text-white">
                        قطعة متوافقة ومخصصة للجهاز الأصلي
                      </span>
                      <span className="text-slate-600 dark:text-slate-300">
                        عمل مضمون 100% مع جهاز {product.compatible_devices[0].name}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/product/${product.compatible_devices[0].slug}`}
                    className="shrink-0 text-xs font-bold text-brand-800 underline dark:text-cyan-300"
                  >
                    عرض الجهاز
                  </Link>
                </div>
              )}

              {/* Quantity Stepper & Buy Action */}
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                {/* Stepper */}
                <div className="flex items-center justify-between rounded-full border border-slate-300 bg-white p-1.5 shadow-xs dark:border-slate-700 dark:bg-slate-800 sm:w-36">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    aria-label="إنقاص الكمية"
                    className="flex size-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="font-extrabold text-slate-900 dark:text-white ltr-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    disabled={quantity >= 10}
                    aria-label="زيادة الكمية"
                    className="flex size-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  type="button"
                  onClick={() => {
                    addItem(product, quantity)
                    navigate('/cart')
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-800 px-8 py-4 text-base font-bold text-white shadow-lg shadow-brand-900/20 transition-all hover:bg-brand-700 active:scale-95 dark:bg-brand-600 dark:hover:bg-brand-500 cursor-pointer"
                >
                  <ShoppingBag className="size-5" />
                  <span>إضافة للسلة والطلب (كاش)</span>
                </button>
              </div>

              {/* Quick Guarantees Grid */}
              <div className="mt-8 grid gap-3 border-t border-slate-200 pt-6 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4.5 text-brand-600 dark:text-cyan-400" />
                  <span>أصلي 100% ومطابق للمواصفات الطبية</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="size-4.5 text-brand-600 dark:text-cyan-400" />
                  <span>شحن سريع لجميع المدن الليبية</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications & Description Section Tabs */}
        <div className="mt-16 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('desc')}
              className={`border-b-2 px-6 py-3 text-sm font-bold transition-colors ${
                activeTab === 'desc'
                  ? 'border-brand-800 text-brand-800 dark:border-cyan-400 dark:text-cyan-300'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              الوصف التفصيلي
            </button>

            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('specs')}
                className={`border-b-2 px-6 py-3 text-sm font-bold transition-colors ${
                  activeTab === 'specs'
                    ? 'border-brand-800 text-brand-800 dark:border-cyan-400 dark:text-cyan-300'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                المواصفات الفنية
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('shipping')}
              className={`border-b-2 px-6 py-3 text-sm font-bold transition-colors ${
                activeTab === 'shipping'
                  ? 'border-brand-800 text-brand-800 dark:border-cyan-400 dark:text-cyan-300'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              الشحن والتوصيل في ليبيا
            </button>
          </div>

          <div className="mt-6">
            {activeTab === 'desc' && (
              <div
                className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-700 dark:prose-invert dark:text-slate-300"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            )}

            {activeTab === 'specs' && product.specifications && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(product.specifications).map(([key, val], i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60"
                  >
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {key}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{val}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                <p>
                  <strong>التوصيل داخل ليبيا:</strong> يتم الشحن لكافة المدن والمناطق (طرابلس، بنغازي، مصراتة، الزاوية،
                  البيضاء، سبها، الخمس، زليتن...) خلال 24-48 ساعة.
                </p>
                <p>
                  <strong>طريقة الدفع:</strong> يتم سداد قيمة الطلب نقداً (كاش بالدينار الليبي) لمندوب التوصيل بعد معاينة
                  الجهاز وفحصه والتأكد من سلامته.
                </p>
                <p>
                  <strong>الأصالة والجودة:</strong> نضمن لك الحصول على جهاز H2O Floss الأصلي المعتمد بالعلبة المصنعية الكاملة.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Related parts temporarily removed per user request */}
      </div>

      {/* Sticky Mobile Buy Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/95 p-3.5 shadow-2xl backdrop-blur-md lg:hidden dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-md items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-slate-500">إجمالي الطلب ({quantity} قطعة)</span>
            <div className="text-lg font-black text-brand-900 dark:text-white ltr-nums">
              {Math.round(parseFloat(product.price)) * quantity} د.ل
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              addItem(product, quantity)
              navigate('/cart')
            }}
            className="flex items-center gap-2 rounded-full bg-brand-800 px-6 py-3 text-sm font-bold text-white shadow-md active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="size-4" />
            <span>طلب الآن (كاش)</span>
          </button>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {zoomModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setZoomModalOpen(false)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] rounded-3xl bg-white p-4 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomModalOpen(false)}
              aria-label="إغلاق التكبير"
              className="absolute top-4 end-4 flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
            >
              <X className="size-5" />
            </button>
            <img src={currentDisplayImg} alt="" className="max-h-[80vh] w-full object-contain rounded-2xl" />
          </div>
        </div>
      )}
    </div>
  )
}

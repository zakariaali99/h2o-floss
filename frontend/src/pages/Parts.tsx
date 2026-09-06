import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Droplets, Filter, ShoppingBag, Wrench } from 'lucide-react'

import { catalogApi } from '../api/catalog'
import { useCartStore } from '../features/cart/store'
import { GridSkeleton } from '../components/ui/ProductSkeleton'
import type { ProductCard } from '../api/types'

export function PartsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const addItem = useCartStore((state) => state.addItem)
  const activeCategory = searchParams.get('category') ?? 'all'

  // Fetch categories
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => catalogApi.getCategories(),
  })

  // Fetch products
  const productsQuery = useQuery({
    queryKey: ['parts-products', activeCategory],
    queryFn: () =>
      catalogApi.getProducts({
        category: activeCategory !== 'all' ? activeCategory : undefined,
      }),
  })

  const categories = categoriesQuery.data ?? []
  const products = productsQuery.data?.results ?? []

  // Filter out main hero device if listing parts only
  const filteredProducts = products.filter((p) => p.slug !== 'h2o-floss')

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Page Header */}
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3.5 py-1 text-xs font-bold text-brand-800 dark:bg-slate-800 dark:text-cyan-300">
          <Wrench className="size-3.5" />
          <span>ملحقات وقطع غيار أصلية 100%</span>
        </span>
        <h1 className="mt-4 text-3xl font-black text-slate-900 sm:text-4xl dark:text-white">
          قطع الغيار والرؤوس البديلة
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          جميع الملحقات ورؤوس الاستبدال لجهاز H2O Floss متوفرة دائماً في مخازننا في ليبيا بأسعار مناسبة وتوصيل سريع لكافة
          المدن.
        </p>
      </div>

      {/* Category Filter Chips Bar */}
      <div className="mt-10 flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide justify-start sm:justify-center">
        <button
          type="button"
          onClick={() => setSearchParams({})}
          className={`rounded-full px-5 py-2 text-xs font-bold transition-all shrink-0 ${
            activeCategory === 'all'
              ? 'bg-brand-800 text-white shadow-md shadow-brand-900/20 dark:bg-brand-600'
              : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
          }`}
        >
          كافة القطع والملحقات
        </button>

        {categories.map((cat) => {
          const isActive = activeCategory === cat.slug
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSearchParams({ category: cat.slug })}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-brand-800 text-white shadow-md shadow-brand-900/20 dark:bg-brand-600'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              {cat.name} ({cat.product_count})
            </button>
          )
        })}
      </div>

      {/* Products Grid */}
      {productsQuery.isLoading ? (
        <div className="mt-8">
          <GridSkeleton count={6} />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-12 text-center my-12 dark:border-slate-800 dark:bg-slate-900">
          <Filter className="mx-auto size-10 text-slate-400" />
          <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">لا توجد قطع في هذه الفئة</h3>
          <p className="mt-1 text-xs text-slate-500">اختر فئة أخرى لعرض القطع والملحقات المتوفرة.</p>
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className="mt-4 rounded-full bg-brand-800 px-5 py-2 text-xs font-bold text-white"
          >
            عرض كافة القطع
          </button>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((part: ProductCard) => (
            <div
              key={part.id}
              className="group flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/80"
            >
              <div>
                {/* Part Image Frame */}
                <div className="relative overflow-hidden rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  {part.main_image ? (
                    <img
                      src={part.main_image}
                      alt={part.name}
                      className="mx-auto aspect-square size-36 object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="mx-auto flex aspect-square size-36 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-slate-800 dark:text-cyan-300">
                      <Wrench className="size-12" />
                    </div>
                  )}

                  {part.category && (
                    <span className="absolute top-2 start-2 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold text-brand-800 shadow-xs backdrop-blur-md dark:bg-slate-900/90 dark:text-cyan-300">
                      {part.category.name}
                    </span>
                  )}
                </div>

                {/* Compatibility Banner */}
                <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-brand-800 dark:text-cyan-300">
                  <Droplets className="size-3.5 text-cyan-500" />
                  <span>يعمل مع: جهاز H2O Floss الأصلي</span>
                </div>

                {/* Part Title */}
                <h3 className="mt-1.5 text-base font-bold text-slate-900 dark:text-white">
                  {part.name}
                </h3>

                {part.tagline && (
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2 dark:text-slate-400">
                    {part.tagline}
                  </p>
                )}
              </div>

              {/* Price & Buy Action */}
              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                <div>
                  <span className="text-base font-black text-brand-900 dark:text-white ltr-nums">
                    {Math.round(parseFloat(part.price))}
                  </span>
                  <span className="text-xs font-bold text-brand-700 dark:text-cyan-300 me-1">د.ل</span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/product/${part.slug}`}
                    className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                  >
                    التفاصيل
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      addItem(part, 1)
                      navigate('/cart')
                    }}
                    className="flex items-center gap-1 rounded-full bg-brand-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-brand-700 active:scale-95 dark:bg-brand-600 cursor-pointer"
                  >
                    <ShoppingBag className="size-3.5" />
                    <span>طلب</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Back Link */}
      <div className="mt-16 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:text-brand-800 dark:text-cyan-400"
        >
          <span>العودة لصفحة الجهاز الرئيسية</span>
          <ArrowLeft className="size-4" />
        </Link>
      </div>
    </div>
  )
}

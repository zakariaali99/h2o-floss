import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Filter, Wrench } from 'lucide-react'

import { catalogApi } from '../api/catalog'
import { GridSkeleton } from '../components/ui/ProductSkeleton'
import type { ProductCard } from '../api/types'

export function CategoryDetailPage() {
  const { slug } = useParams<{ slug: string }>()

  // Fetch categories to find current category details
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => catalogApi.getCategories(),
  })

  const category = categoriesQuery.data?.find((c) => c.slug === slug)

  // Fetch products in this category
  const productsQuery = useQuery({
    queryKey: ['category-products', slug],
    queryFn: () => catalogApi.getProducts({ category: slug }),
    enabled: Boolean(slug),
  })

  const products = productsQuery.data?.results ?? []

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <Link to="/" className="hover:text-brand-600 dark:hover:text-cyan-300">
          الرئيسية
        </Link>
        <span>/</span>
        <Link to="/parts" className="hover:text-brand-600 dark:hover:text-cyan-300">
          الكتالوج
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-white">{category?.name ?? slug}</span>
      </nav>

      {/* Header */}
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-black text-slate-900 sm:text-4xl dark:text-white">
          {category?.name ?? 'فئة المنتجات'}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          استعرض كافة المنتجات والملحقات المتوفرة تحت فئة {category?.name ?? slug}.
        </p>
      </div>

      {/* Grid */}
      {productsQuery.isLoading ? (
        <div className="mt-10">
          <GridSkeleton count={6} />
        </div>
      ) : products.length === 0 ? (
        <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-12 text-center my-12 dark:border-slate-800 dark:bg-slate-900">
          <Filter className="mx-auto size-10 text-slate-400" />
          <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">لا توجد منتجات</h3>
          <p className="mt-1 text-xs text-slate-500">لا تتوفر منتجات حالية تحت هذه الفئة.</p>
          <Link
            to="/parts"
            className="mt-4 inline-block rounded-full bg-brand-800 px-5 py-2 text-xs font-bold text-white"
          >
            تصفح الكتالوج الكامل
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((item: ProductCard) => (
            <div
              key={item.id}
              className="group flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-xs transition-all hover:border-brand-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="relative overflow-hidden rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  {item.main_image ? (
                    <img
                      src={item.main_image}
                      alt={item.name}
                      className="mx-auto aspect-square size-36 object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="mx-auto flex aspect-square size-36 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-slate-800 dark:text-cyan-300">
                      <Wrench className="size-12" />
                    </div>
                  )}
                </div>

                <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                  {item.name}
                </h3>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                <span className="text-base font-black text-brand-900 dark:text-white ltr-nums">
                  {Math.round(parseFloat(item.price))} د.ل
                </span>
                <Link
                  to={`/product/${item.slug}`}
                  className="rounded-full bg-brand-800 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-700"
                >
                  عرض التفاصيل
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 text-center">
        <Link
          to="/parts"
          className="inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:text-brand-800 dark:text-cyan-400"
        >
          <span>العودة لكتالوج الملحقات</span>
          <ArrowLeft className="size-4" />
        </Link>
      </div>
    </div>
  )
}

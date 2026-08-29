import { useQuery } from '@tanstack/react-query'

import { api } from '../api/client'
import type { HealthResponse, StoreConfig } from '../api/types'

/**
 * P0 placeholder landing page. Its job is to prove the Vite → Django proxy,
 * the typed API client and the RTL shell. Full marketing layout arrives in P5.
 */
export function Home() {
  const health = useQuery({ queryKey: ['health'], queryFn: () => api.get<HealthResponse>('/health/') })
  const store = useQuery({ queryKey: ['store-config'], queryFn: () => api.get<StoreConfig>('/config/') })

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <section className="rounded-card bg-white p-10 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        <p className="mb-3 inline-block rounded-full bg-brand-50 px-4 py-1 text-sm font-bold text-brand-800 dark:bg-slate-900 dark:text-brand-200">
          الخيار الأول لأطباء الأسنان
        </p>
        <h1 className="text-4xl font-extrabold leading-tight text-slate-900 dark:text-white md:text-5xl">
          العناية المتكاملة<br />
          <span className="text-brand-600">بصحة أسنانك</span>
        </h1>
        <p className="mt-4 max-w-xl leading-8 text-slate-600 dark:text-slate-300">
          اكتشف جهاز H2O Floss للتنظيف بالماء — تقنية متقدمة تصل إلى أعمق الأماكن لتمنحك نظافة فائقة
          ولثة صحية في دقائق.
        </p>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
            <dt className="text-sm text-slate-500">حالة الواجهة الخلفية</dt>
            <dd className="mt-1 font-bold">
              {health.isPending && '…'}
              {health.isError && 'تعذّر الاتصال — شغّل خادم Django'}
              {health.data ? `سليمة (${health.data.service})` : null}
            </dd>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
            <dt className="text-sm text-slate-500">إعدادات المتجر</dt>
            <dd className="mt-1 font-bold">
              {store.data
                ? `العملة ${store.data.currency} · توصيل ${store.data.free_shipping ? 'مجاني' : 'مدفوع'} · ${store.data.cities.length} مدينة`
                : '…'}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  )
}

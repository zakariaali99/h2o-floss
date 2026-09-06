import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Phone, Search, Truck } from 'lucide-react'

import { ordersApi } from '../api/orders'
import type { OrderData } from '../api/types'

export function TrackOrderPage() {
  const [searchParams] = useSearchParams()
  const initialPhone = searchParams.get('phone') || ''
  const initialNumber = searchParams.get('number') || ''

  const [phone, setPhone] = useState(initialPhone)
  const [orderNumber, setOrderNumber] = useState(initialNumber)
  const [loading, setLoading] = useState(false)
  const [orderResult, setOrderResult] = useState<OrderData | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const executeLookup = async (p: string, n: string) => {
    if (!p.trim() && !n.trim()) {
      setErrorMsg('يرجى إدخال رقم الهاتف أو رقم الطلب للاستعلام.')
      return
    }

    try {
      setLoading(true)
      setErrorMsg(null)
      setOrderResult(null)
      const data = await ordersApi.lookupOrder(n.trim(), p.trim())
      setOrderResult(data)
    } catch (err: unknown) {
      setErrorMsg('لم نتمكن من العثور على أي طلب مطابق للبيانات المدخلة. يرجى التأكد من رقم الهاتف أو رقم الطلب.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialPhone || initialNumber) {
      executeLookup(initialPhone, initialNumber)
    }
  }, [initialPhone, initialNumber])

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault()
    executeLookup(phone, orderNumber)
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-800 dark:bg-slate-800 dark:text-cyan-300">
            <Truck className="size-6" />
          </div>
          <h1 className="mt-4 text-2xl font-black text-slate-900 dark:text-white">تتبع حالة طلبك</h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            أدخل <span className="font-bold text-brand-700 dark:text-cyan-300">رقم هاتفك المسجل</span> أو رقم الطلب للتحقق فوراً من مسار التجهيز والشحن.
          </p>
        </div>

        {errorMsg && (
          <div className="mt-6 flex items-center gap-2 rounded-2xl bg-rose-50 p-4 text-xs text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
            <AlertCircle className="size-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLookup} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              رقم الهاتف المسجل (يمكنك البحث برقم هاتفك فقط)
            </label>
            <div className="relative mt-1.5">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="مثال: 0912345678"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white ltr-nums"
                dir="ltr"
              />
              <Phone className="absolute top-3.5 end-3.5 size-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              أو رقم الطلب (اختياري)
            </label>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="H2O-2026-..."
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white ltr-nums"
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-800 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-brand-700 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Search className="size-4" />
            <span>{loading ? 'جاري الاستعلام...' : 'استعلام عن حالة الطلب'}</span>
          </button>
        </form>

        {/* Search Results Display */}
        {orderResult && (
          <div className="mt-8 border-t border-slate-100 pt-6 animate-in fade-in dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">حالة الطلب الحالية:</span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {orderResult.status_display}
              </span>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">رقم الطلب:</span>
                <span className="font-bold text-slate-900 dark:text-white ltr-nums">{orderResult.number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">الاسم:</span>
                <span className="font-bold text-slate-900 dark:text-white">{orderResult.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">المدينة والتوصيل:</span>
                <span className="font-bold text-slate-900 dark:text-white">{orderResult.city_name} — {orderResult.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">طريقة الدفع:</span>
                <span className="font-bold text-brand-800 dark:text-cyan-300">
                  {orderResult.payment_method === 'BANK_TRANSFER' ? 'تحويل مصرفي عبر واتساب' : 'كاش عند الاستلام'}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200/60 pt-2 font-black">
                <span>الإجمالي:</span>
                <span className="text-brand-800 dark:text-cyan-300 ltr-nums">{orderResult.total} د.ل</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center">
              <Link
                to={`/order/${orderResult.number}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-800 dark:text-cyan-300"
              >
                <span>عرض الفاتورة وتأكيد الواتساب</span>
                <ArrowLeft className="size-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

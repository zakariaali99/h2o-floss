import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  MessageCircle,
  Truck,
} from 'lucide-react'

import { ordersApi } from '../api/orders'

export function OrderSuccessPage() {
  const { number = '' } = useParams<{ number: string }>()
  const [copiedOrder, setCopiedOrder] = useState(false)

  // 1. Fetch order details
  const { data: order } = useQuery({
    queryKey: ['order-success', number],
    queryFn: () => ordersApi.lookupOrder(number, ''),
    enabled: Boolean(number),
    retry: 2,
  })

  // 2. Fetch live store settings (only the public store WhatsApp number is used here)
  const { data: settings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => ordersApi.getStoreSettings(),
    staleTime: 30000,
  })

  const storeWhatsapp = settings?.store_whatsapp || '218910000000'

  // Copy Order Number
  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(number)
    setCopiedOrder(true)
    setTimeout(() => setCopiedOrder(false), 2500)
  }

  // Plain customer-support WhatsApp link (no invoice or bank details).
  const supportMessage = `مرحباً، لدي استفسار بخصوص طلبي رقم #${number}`
  const supportWhatsappUrl = `https://wa.me/${storeWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
    supportMessage,
  )}`

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {/* 1. SUCCESS BADGE BANNER */}
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-8 text-center dark:border-emerald-900/60 dark:bg-emerald-950/40 shadow-xs">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
          <CheckCircle2 className="size-10" />
        </div>
        <h1 className="mt-4 text-2xl font-black text-emerald-950 sm:text-3xl dark:text-emerald-100">
          تم إرسال وتأكيد طلبك بنجاح!
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-emerald-800 dark:text-emerald-300 max-w-lg mx-auto">
          شكراً لاختيارك متجر H2O Floss للعناية المائية المتكاملة. تم تسجيل طلبك وسيتواصل معك فريقنا لتأكيد التوصيل.
        </p>

        {/* COPY ORDER NUMBER BUTTON */}
        <div className="mt-6 inline-flex flex-col sm:flex-row items-center gap-3 rounded-2xl border border-emerald-300/80 bg-white p-2.5 sm:px-5 sm:py-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">رقم الطلب الخاص بك:</span>
            <span className="text-base font-black text-brand-800 dark:text-cyan-300 ltr-nums" dir="ltr">
              {number}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyOrderNumber}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              copiedOrder
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {copiedOrder ? (
              <>
                <Check className="size-3.5" />
                <span>تم النسخ بنجاح!</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                <span>نسخ رقم الطلب</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. OPTIONAL DIRECT SUPPORT BUTTON */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
        <div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
            هل ترغب في التواصل المباشر مع خدمة العملاء؟
          </h4>
          <p className="text-[11px] text-slate-400">
            يمكنك فتح محادثة واتساب المتجر في أي وقت للاستفسار عن طلبك.
          </p>
        </div>

        <a
          href={supportWhatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 shrink-0"
        >
          <MessageCircle className="size-4" />
          <span>فتح محادثة واتساب المتجر</span>
        </a>
      </div>

      {/* 3. ORDER PROGRESS STATUS TIMELINE */}
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">مراحل تنفيذ وتوصيل الطلب</h3>

        <div className="mt-6 grid grid-cols-4 gap-2 text-center">
          <div className="flex flex-col items-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs">
              ✓
            </div>
            <span className="mt-2 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
              تم استلام الطلب
            </span>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-brand-100 text-brand-800 font-bold text-xs dark:bg-slate-800 dark:text-cyan-300">
              <Clock className="size-5" />
            </div>
            <span className="mt-2 text-[11px] font-bold text-slate-900 dark:text-white">
              قيد المراجعة
            </span>
          </div>

          <div className="flex flex-col items-center opacity-50">
            <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 font-bold text-xs dark:bg-slate-800">
              <Truck className="size-5" />
            </div>
            <span className="mt-2 text-[11px] font-semibold text-slate-500">مع المندوب</span>
          </div>

          <div className="flex flex-col items-center opacity-50">
            <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 font-bold text-xs dark:bg-slate-800">
              <CheckCircle2 className="size-5" />
            </div>
            <span className="mt-2 text-[11px] font-semibold text-slate-500">تم الاستلام</span>
          </div>
        </div>
      </div>

      {/* 4. ORDER INVOICE DETAILS CARD */}
      {order && (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">تفاصيل الشحنة والفاتورة</h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <span>طريقة الدفع:</span>
              <span className="text-brand-800 dark:text-cyan-300">
                {order.payment_method === 'BANK_TRANSFER' ? 'تحويل مصرفي' : 'كاش عند الاستلام'}
              </span>
            </span>
          </div>

          <div className="mt-4 grid gap-3 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2">
            <div>
              <span className="text-slate-400">الاسم الكامل:</span> {order.full_name}
            </div>
            <div>
              <span className="text-slate-400">رقم الهاتف:</span>{' '}
              <span className="ltr-nums font-semibold">{order.phone}</span>
            </div>
            <div>
              <span className="text-slate-400">المدينة:</span> {order.city_name}
            </div>
            <div>
              <span className="text-slate-400">مكان التوصيل بالتفصيل:</span> {order.address}
            </div>
          </div>

          {/* Items Summary Table */}
          {order.items && order.items.length > 0 && (
            <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">عناصر الفاتورة:</h4>
              <div className="space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 dark:border-slate-800/50">
                    <span className="text-slate-800 dark:text-slate-200">
                      {item.product_name} <span className="text-slate-400">× {item.quantity}</span>
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white ltr-nums">
                      {item.line_total} د.ل
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between text-xs font-black text-slate-900 dark:text-white pt-2">
                <span>المجموع الكلي:</span>
                <span className="text-base text-brand-800 dark:text-cyan-300 ltr-nums">{order.total} د.ل</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. ACTIONS NAVIGATION */}
      <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          to={`/track?phone=${encodeURIComponent(order?.phone || '')}`}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 px-6 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 sm:w-auto dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <span>تتبع حالة الشحنة برقم هاتفك</span>
        </Link>

        <Link
          to="/"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-800 px-6 py-3.5 text-xs font-bold text-white shadow-md hover:bg-brand-700 sm:w-auto"
        >
          <span>العودة لصفحة المتجر الرئيسية</span>
          <ArrowLeft className="size-4" />
        </Link>
      </div>
    </div>
  )
}

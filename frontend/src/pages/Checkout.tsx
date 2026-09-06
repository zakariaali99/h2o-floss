import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, ArrowLeft, Banknote, CheckCircle2, Loader2 } from 'lucide-react'

import { ordersApi } from '../api/orders'
import { useCartStore } from '../features/cart/store'
import type { CheckoutPayload } from '../api/types'

const libyanCities = [
  { code: 'tripoli', name: 'طرابلس' },
  { code: 'benghazi', name: 'بنغازي' },
  { code: 'misrata', name: 'مصراتة' },
  { code: 'zawiya', name: 'الزاوية' },
  { code: 'bayda', name: 'البيضاء' },
  { code: 'sabha', name: 'سبها' },
  { code: 'khoms', name: 'الخمس' },
  { code: 'zliten', name: 'زليتن' },
  { code: 'tobruk', name: 'طبرق' },
  { code: 'derna', name: 'درنة' },
  { code: 'gharyan', name: 'غريان' },
  { code: 'tarhuna', name: 'ترهونة' },
  { code: 'sirt', name: 'سرت' },
  { code: 'sabratha', name: 'صبراتة' },
  { code: 'zuwara', name: 'زوارة' },
  { code: 'ajdabiya', name: 'أجدابيا' },
]

const checkoutSchema = z.object({
  full_name: z.string().min(2, 'يرجى كتابة الاسم الكامل'),
  phone: z
    .string()
    .regex(/^09\d{8}$/, 'يرجى إدخال رقم هاتف ليبي صحيح مكون من 10 أرقام (مثال: 0912345678)'),
  city: z.string().min(1, 'يرجى اختيار المدينة'),
  address: z.string().min(3, 'يرجى كتابة مكان أو عنوان التوصيل بالتفصيل'),
  payment_method: z.enum(['CASH_ON_DELIVERY', 'BANK_TRANSFER']),
  note: z.string().optional(),
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

export function CheckoutPage() {
  const navigate = useNavigate()
  const { items, subtotal, clearCart } = useCartStore()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const cartSubtotal = subtotal()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      city: 'tripoli',
      address: '',
      payment_method: 'CASH_ON_DELIVERY',
      note: '',
    },
  })

  const selectedPaymentMethod = watch('payment_method')

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">سلة المشتريات فارغة</h2>
        <p className="mt-2 text-xs text-slate-500">يرجى إضافة المنتجات أولاً قبل متابعة الشراء.</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-800 px-6 py-3 text-xs font-bold text-white shadow-md"
        >
          <span>العودة للمتجر</span>
        </Link>
      </div>
    )
  }

  const onSubmit = async (data: CheckoutFormData) => {
    try {
      setIsSubmitting(true)
      setServerError(null)

      const payload: CheckoutPayload = {
        full_name: data.full_name,
        phone: data.phone,
        city: data.city,
        address: data.address,
        payment_method: data.payment_method,
        note: data.note || '',
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
        })),
      }

      const res = await ordersApi.submitCheckout(payload)
      clearCart()
      navigate(`/order/${res.number}`, { replace: true })
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === 'object' && 'data' in err
          ? JSON.stringify((err as { data: unknown }).data)
          : 'حدث خطأ أثناء إرسال الطلب. يرجى التأكد من البيانات والمحاولة مجدداً.'
      setServerError(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 dark:border-slate-800">
        <h1 className="text-2xl font-black text-slate-900 sm:text-3xl dark:text-white">
          إتمام الطلب وتأكيد الشراء
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          أدخل بيانات التوصيل بدقة ليتواصل معك مندوب الشحن فور تجهيز طلبك.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* Customer Info Form */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8 dark:border-slate-800 dark:bg-slate-900">
            {serverError && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl bg-rose-50 p-4 text-xs text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                <AlertCircle className="size-5 shrink-0 text-rose-600" />
                <div>
                  <span className="font-bold">عذراً! لم نتمكن من إتمام الطلب:</span>
                  <p className="mt-1">{serverError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  الاسم الكامل (الاسم الثلاثي) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('full_name')}
                  placeholder="مثال: أحمد عبدالسلام المريمي"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                {errors.full_name && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    {errors.full_name.message}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  رقم الهاتف (ليبي للتواصل والمتابعة) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  {...register('phone')}
                  placeholder="0912345678"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white ltr-nums"
                  dir="ltr"
                />
                {errors.phone && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* City Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  المدينة <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('city')}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {libyanCities.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.city && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    {errors.city.message}
                  </p>
                )}
              </div>

              {/* Detailed Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  المكان وعنوان التوصيل بالتفصيل <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  {...register('address')}
                  placeholder="اسم الشارع، الحي/المنطقة، أقرب معلم معروف (مثال: طرابلس — النوفليين، قرب جامع الخليل)"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                {errors.address && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    {errors.address.message}
                  </p>
                )}
              </div>

              {/* PAYMENT METHOD SELECTION */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  طريقة الدفع المفضلة <span className="text-rose-500">*</span>
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Cash on Delivery Card */}
                  <button
                    type="button"
                    onClick={() => setValue('payment_method', 'CASH_ON_DELIVERY')}
                    className={`flex flex-col items-start p-4 rounded-2xl border text-start transition-all cursor-pointer ${
                      selectedPaymentMethod === 'CASH_ON_DELIVERY'
                        ? 'border-brand-600 bg-brand-50/50 shadow-sm ring-2 ring-brand-500/30 dark:border-cyan-400 dark:bg-slate-800'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>💵</span>
                        <span>دفع عند الاستلام (كاش)</span>
                      </span>
                      {selectedPaymentMethod === 'CASH_ON_DELIVERY' && (
                        <CheckCircle2 className="size-4 text-brand-600 dark:text-cyan-400 shrink-0" />
                      )}
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      الدفع نقداً يداً بيد للمندوب بعد استلام المنتج ومعاينته.
                    </p>
                  </button>

                  {/* Bank Transfer Card */}
                  <button
                    type="button"
                    onClick={() => setValue('payment_method', 'BANK_TRANSFER')}
                    className={`flex flex-col items-start p-4 rounded-2xl border text-start transition-all cursor-pointer ${
                      selectedPaymentMethod === 'BANK_TRANSFER'
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-500/30 dark:border-emerald-400 dark:bg-slate-800'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>💳</span>
                        <span>تحويل مصرفي عبر واتساب</span>
                      </span>
                      {selectedPaymentMethod === 'BANK_TRANSFER' && (
                        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      استلام الفاتورة وبيانات الحساب المصرفي (IBAN) عبر واتساب لمشاركة إيصال التحويل.
                    </p>
                  </button>
                </div>
              </div>

              {/* Order Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  ملاحظات إضافية (اختياري)
                </label>
                <input
                  type="text"
                  {...register('note')}
                  placeholder="وقت التوصيل المفضل أو أي ملاحظة للمندوب..."
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Payment Notice */}
              <div className={`rounded-2xl border p-4 ${
                selectedPaymentMethod === 'BANK_TRANSFER'
                  ? 'border-emerald-300 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/40'
                  : 'border-brand-200 bg-brand-50/70 dark:border-slate-800 dark:bg-slate-900/60'
              }`}>
                <div className="flex items-start gap-3">
                  <Banknote className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-emerald-200">
                      {selectedPaymentMethod === 'BANK_TRANSFER'
                        ? 'طريقة الدفع المحددة: تحويل مصرفي عبر واتساب'
                        : 'طريقة الدفع المحددة: نقداً عند الاستلام (كاش)'}
                    </h4>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                      {selectedPaymentMethod === 'BANK_TRANSFER'
                        ? 'ستظهر لك تفاصيل الحساب المصرفي ورقم الآيبان (IBAN) في الصفحة التالية، بالإضافة إلى رابط واتساب مباشر لإرسال إيصال التحويل للمتابعة الفورية.'
                        : 'تقوم بسداد المبلغ نقداً لمندوب التوصيل بعد استلام ومعاينة الشحنة بالكامل.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-800 py-4 text-base font-bold text-white shadow-lg shadow-brand-900/20 transition-all hover:bg-brand-700 active:scale-95 disabled:opacity-50 dark:bg-brand-600 dark:hover:bg-brand-500 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    <span>جاري إرسال وتأكيد الطلب...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-5" />
                    <span>تأكيد الطلب الآن (الدفع عند الاستلام)</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Order Items Review Sidebar */}
        <div className="lg:col-span-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">المنتجات في الطلب</h3>

            <div className="mt-4 space-y-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              {items.map(({ product, quantity }) => {
                const price = parseFloat(product.price) || 0
                return (
                  <div key={product.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-6 items-center justify-center rounded-md bg-slate-100 font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300 ltr-nums">
                        {quantity}×
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {product.name}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white ltr-nums shrink-0 ms-2">
                      {Math.round(price * quantity)} د.ل
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>المجموع الفرعي:</span>
                <span className="font-bold text-slate-900 dark:text-white ltr-nums">
                  {Math.round(cartSubtotal)} د.ل
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>الشحن والتوصيل:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  سريع لكافة المدن
                </span>
              </div>
            </div>

            <div className="mt-4 flex justify-between border-t border-slate-100 pt-4 text-base font-black dark:border-slate-800">
              <span className="text-slate-900 dark:text-white">الإجمالي المستحق:</span>
              <span className="text-brand-900 dark:text-cyan-400 ltr-nums">
                {Math.round(cartSubtotal)} د.ل
              </span>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-4 text-center dark:border-slate-800">
              <Link
                to="/cart"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-800 dark:text-cyan-400"
              >
                <ArrowLeft className="size-3.5" />
                <span>تعديل محتويات السلة</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

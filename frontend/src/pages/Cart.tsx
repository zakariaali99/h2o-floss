import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, Truck, Wrench } from 'lucide-react'
import { useCartStore } from '../features/cart/store'

export function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, subtotal } = useCartStore()

  const cartSubtotal = subtotal()

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-brand-50 text-brand-700 dark:bg-slate-800 dark:text-cyan-300">
          <ShoppingBag className="size-10" />
        </div>
        <h1 className="mt-6 text-2xl font-black text-slate-900 dark:text-white">سلة المشتريات فارغة</h1>
        <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          لم تقم بإضافة أي منتجات أو ملحقات لسلتك بعد. يمكنك اختيار جهاز H2O Floss أو قطع الغيار البديلة الآن.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/product/h2o-floss"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-800 px-6 py-3.5 text-xs font-bold text-white shadow-md transition-all hover:bg-brand-700 sm:w-auto"
          >
            <span>عرض جهاز H2O Floss الأصلي</span>
            <ArrowLeft className="size-4" />
          </Link>
          <Link
            to="/"
            className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 px-6 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 sm:w-auto dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <span>العودة للصفحة الرئيسية</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-6 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl dark:text-white">سلة المشتريات</h1>
          <p className="mt-1 text-xs text-slate-500">
            راجع المنتجات المختارة قبل إتمام الطلب (الدفع نقداً عند الاستلام)
          </p>
        </div>

        <button
          type="button"
          onClick={clearCart}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400"
        >
          <Trash2 className="size-3.5" />
          <span>تفريغ السلة</span>
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        {/* Items List */}
        <div className="space-y-4 lg:col-span-8">
          {items.map(({ product, quantity }) => {
            const unitPrice = parseFloat(product.price) || 0
            const lineTotal = unitPrice * quantity

            return (
              <div
                key={product.id}
                className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Image */}
                <div className="flex shrink-0 items-center justify-center rounded-2xl bg-slate-50 p-2 dark:bg-slate-800">
                  {product.main_image ? (
                    <img src={product.main_image} alt="" className="size-20 object-contain" />
                  ) : (
                    <div className="flex size-20 items-center justify-center text-brand-700 dark:text-cyan-300">
                      <Wrench className="size-8" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {product.category?.name ?? (product.kind === 'DEVICE' ? 'جهاز رئيسي' : 'ملحق')}
                  </span>
                  <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                    <Link to={`/product/${product.slug}`} className="hover:text-brand-700 dark:hover:text-cyan-300">
                      {product.name}
                    </Link>
                  </h3>
                  <div className="mt-1 text-xs text-slate-500 ltr-nums">
                    سعر القطعة: {Math.round(unitPrice)} د.ل
                  </div>
                </div>

                {/* Controls & Total */}
                <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0">
                  {/* Stepper */}
                  <div className="flex items-center rounded-full border border-slate-300 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                      aria-label="إنقاص الكمية"
                      className="flex size-7 items-center justify-center rounded-full text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-slate-900 dark:text-white ltr-nums">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      aria-label="زيادة الكمية"
                      className="flex size-7 items-center justify-center rounded-full text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-end">
                    <div className="text-base font-black text-brand-900 dark:text-cyan-400 ltr-nums">
                      {Math.round(lineTotal)} د.ل
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => removeItem(product.id)}
                    aria-label="إزالة المنتَج"
                    className="flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            )
          })}

          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-800 dark:text-cyan-400"
            >
              <ArrowRight className="size-3.5" />
              <span>متابعة التسوق والعودة للرئيسية</span>
            </Link>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">ملخص الطلب</h3>

            <div className="mt-4 space-y-3 border-b border-slate-100 pb-4 text-xs dark:border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">المجموع الفرعي:</span>
                <span className="font-bold text-slate-900 dark:text-white ltr-nums">
                  {Math.round(cartSubtotal)} د.ل
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">التوصيل والشحن:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  سريع لكافة المدن
                </span>
              </div>
            </div>

            <div className="mt-4 flex justify-between text-base font-black">
              <span className="text-slate-900 dark:text-white">الإجمالي النهائي:</span>
              <span className="text-brand-900 dark:text-cyan-400 ltr-nums">
                {Math.round(cartSubtotal)} د.ل
              </span>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-100 p-3 text-[11px] font-semibold text-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 shrink-0 text-brand-600 dark:text-cyan-400" />
                <span>الدفع نقداً عند الاستلام بعد معاينة وفحص الشحنة بالكامل.</span>
              </div>
            </div>

            <Link
              to="/checkout"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand-800 py-4 text-sm font-bold text-white shadow-lg shadow-brand-900/20 transition-all hover:bg-brand-700 active:scale-95 dark:bg-brand-600"
            >
              <span>متابعة إدخال بيانات الطلب</span>
              <ArrowLeft className="size-4" />
            </Link>

            <div className="mt-6 space-y-2 border-t border-slate-100 pt-4 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Truck className="size-3.5 text-brand-600 dark:text-cyan-400" />
                <span>شحن خلال 24-48 ساعة لمختلف المدن</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-3.5 text-brand-600 dark:text-cyan-400" />
                <span>أصلي 100% ومطابق للمواصفات الطبية</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

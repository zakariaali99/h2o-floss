import { Printer, X } from 'lucide-react'
import type { OrderData } from '../../api/types'

interface OrderReceiptModalProps {
  order: OrderData | null
  onClose: () => void
}

export function OrderReceiptModal({ order, onClose }: OrderReceiptModalProps) {
  if (!order) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in duration-200" onClick={onClose}>
      <div className="relative w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
        {/* Action Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Printer className="size-5 text-brand-700 dark:text-cyan-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              إيصال شحن وتوصيل الطلب — H2O Floss
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-full bg-brand-800 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 active:scale-95"
            >
              <Printer className="size-3.5" />
              <span>طباعة الفاتورة</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Content */}
        <div id="printable-receipt" className="mt-6 space-y-6 text-slate-900 dark:text-white">
          {/* Header Branding */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h2 className="text-2xl font-black text-brand-900 dark:text-cyan-400">H2O Floss Libya</h2>
              <p className="text-xs text-slate-500">مؤسسة العناية الفموية المائية — طرابلس، ليبيا</p>
            </div>
            <div className="text-end">
              <span className="text-xs text-slate-400">رقم الفاتورة / الشحنة</span>
              <div className="text-lg font-black text-slate-900 dark:text-white ltr-nums" dir="ltr">
                {order.number}
              </div>
            </div>
          </div>

          {/* Client Details */}
          <div className="rounded-2xl bg-slate-50 p-4 text-xs space-y-2 dark:bg-slate-800/60">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500 dark:text-slate-400">اسم العميل:</span>{' '}
                <strong className="text-slate-900 dark:text-white">{order.full_name}</strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">رقم الهاتف:</span>{' '}
                <strong className="ltr-nums">{order.phone}</strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">المدينة:</span>{' '}
                <strong className="text-slate-900 dark:text-white">{order.city_name}</strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">تاريخ الطلب:</span>{' '}
                <span className="ltr-nums">{order.created_at?.slice(0, 10)}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">العنوان التفصيلي:</span>{' '}
              <strong className="text-slate-900 dark:text-white">{order.address}</strong>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">محتويات الشحنة</h4>
            <div className="rounded-2xl border border-slate-200 overflow-hidden dark:border-slate-800">
              <table className="w-full text-start text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="p-3 text-start">المنتج</th>
                    <th className="p-3 text-center">الكمية</th>
                    <th className="p-3 text-end">سعر الوحدة</th>
                    <th className="p-3 text-end">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {order.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-3 font-semibold">{item.product_name}</td>
                      <td className="p-3 text-center ltr-nums">{item.quantity}</td>
                      <td className="p-3 text-end ltr-nums">{Math.round(parseFloat(item.unit_price))} د.ل</td>
                      <td className="p-3 text-end font-bold ltr-nums">{Math.round(parseFloat(item.line_total))} د.ل</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total & Payment Method */}
          <div className="flex items-center justify-between rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
            <div>
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                طريقة الدفع: نقداً عند الاستلام (كاش)
              </span>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                يرجى تحصيل المبلغ المطلوب بالكامل عند تسليم الطرد للعميل.
              </p>
            </div>
            <div className="text-end">
              <span className="text-xs text-slate-500">المبلغ المطلوب تحصيله</span>
              <div className="text-xl font-black text-brand-900 dark:text-emerald-400 ltr-nums">
                {Math.round(parseFloat(order.total))} د.ل
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

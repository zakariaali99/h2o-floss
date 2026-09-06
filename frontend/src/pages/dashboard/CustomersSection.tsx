import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Eye, Loader2, MessageCircle, Search, X } from 'lucide-react'

import { ordersApi } from '../../api/orders'
import type { CustomerData } from '../../api/types'

export function CustomersSection() {
  const [customerSearch, setCustomerSearch] = useState('')
  const [viewing, setViewing] = useState<CustomerData | null>(null)

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['admin-customers', customerSearch],
    queryFn: () => ordersApi.getAdminCustomers({ search: customerSearch }),
    staleTime: 5000,
  })

  // The clicked customer's full order history (reuses the orders endpoint by phone).
  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ['customer-history', viewing?.phone],
    queryFn: () => ordersApi.getAdminOrders({ search: viewing!.phone }),
    enabled: Boolean(viewing?.phone),
    staleTime: 5000,
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">سجل العملاء والمراسلة</h1>
          <p className="mt-1 text-xs text-slate-500">متابعة حسابات العملاء، عدد الطلبات وإجمالي الإنفاق والمراسلة المباشرة</p>
        </div>
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            placeholder="بحث باسم العميل أو رقم الهاتف..."
            className="w-full rounded-full border border-slate-300 bg-white py-2 ps-9 pe-4 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <Search className="absolute start-3 top-2.5 size-4 text-slate-400" />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3.5 text-start font-bold">اسم العميل</th>
                <th className="px-4 py-3.5 text-start font-bold">رقم الهاتف</th>
                <th className="px-4 py-3.5 text-start font-bold">المدينة</th>
                <th className="px-4 py-3.5 text-start font-bold">عدد الطلبات</th>
                <th className="px-4 py-3.5 text-start font-bold">إجمالي المشتريات</th>
                <th className="px-4 py-3.5 text-start font-bold">آخر طلب</th>
                <th className="px-4 py-3.5 text-center font-bold">مراسلة واتساب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="mx-auto size-6 animate-spin text-brand-700" />
                    <span className="mt-2 block text-xs">جاري تحميل سجل العملاء...</span>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">لا يوجد عملاء مسجلون حالياً.</td>
                </tr>
              ) : (
                customers.map((c) => {
                  const displayName = c.full_name || c.name
                  const whatsappDirectUrl = `https://wa.me/${c.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `مرحباً بك أستاذ ${displayName}، نتواصل معك من متجر H2O Floss ليبيا. كيف يمكننا خدمتك اليوم؟`,
                  )}`
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">{displayName}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-700 dark:text-slate-300 ltr-nums" dir="ltr">{c.phone}</td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">{c.city_name || c.city}</td>
                      <td className="px-4 py-3.5 font-bold text-brand-900 dark:text-cyan-300">{c.orders_count} طلبات</td>
                      <td className="px-4 py-3.5 font-extrabold text-slate-900 dark:text-white ltr-nums">
                        {parseFloat(c.total_spent).toFixed(2)} د.ل
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {c.last_order_status_display ? (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {c.last_order_status_display}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewing(c)}
                            title="عرض بيانات العميل وسجل طلباته"
                            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                          >
                            <Eye className="size-3.5" />
                            <span>عرض السجل</span>
                          </button>
                          <a
                            href={whatsappDirectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-emerald-700"
                          >
                            <MessageCircle className="size-3.5" />
                            <span>واتساب</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer detail + order history modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs" onClick={() => setViewing(null)}>
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {viewing.full_name || viewing.name}
              </h3>
              <button type="button" onClick={() => setViewing(null)} className="text-slate-400 hover:text-slate-600">
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3 text-xs dark:bg-slate-800">
              <div>
                <span className="text-slate-400">الهاتف:</span>
                <span className="block font-bold text-slate-900 dark:text-white ltr-nums" dir="ltr">{viewing.phone}</span>
              </div>
              <div>
                <span className="text-slate-400">المدينة:</span>
                <span className="block font-bold text-slate-900 dark:text-white">{viewing.city_name || viewing.city}</span>
              </div>
              <div>
                <span className="text-slate-400">عدد الطلبات:</span>
                <span className="block font-bold text-brand-900 dark:text-cyan-300">{viewing.orders_count}</span>
              </div>
              <div>
                <span className="text-slate-400">إجمالي المشتريات:</span>
                <span className="block font-bold text-slate-900 dark:text-white ltr-nums">
                  {parseFloat(viewing.total_spent).toFixed(2)} د.ل
                </span>
              </div>
            </div>

            <h4 className="mt-5 mb-2 text-xs font-bold text-slate-700 dark:text-slate-300">سجل الطلبات</h4>
            {historyLoading ? (
              <div className="py-8 text-center text-slate-400">
                <Loader2 className="mx-auto size-5 animate-spin text-brand-700" />
              </div>
            ) : history.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">لا توجد طلبات لهذا العميل.</p>
            ) : (
              <div className="space-y-2">
                {history.map((o) => (
                  <div key={o.number} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-xs dark:border-slate-800">
                    <div>
                      <span className="font-bold text-brand-900 dark:text-cyan-300 ltr-nums" dir="ltr">{o.number}</span>
                      <span className="block text-[11px] text-slate-400">
                        {o.payment_method === 'BANK_TRANSFER' ? 'تحويل مصرفي' : 'كاش عند الاستلام'}
                      </span>
                    </div>
                    <div className="text-end">
                      <span className="font-extrabold text-slate-900 dark:text-white ltr-nums">{o.total} د.ل</span>
                      <span className="block text-[11px] font-bold text-slate-500">{o.status_display}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  Eye,
  FileText,
  Loader2,
  MessageCircle,
  Printer,
  Search,
  X,
} from 'lucide-react'

import { ordersApi } from '../../api/orders'
import { OrderReceiptModal } from '../../components/admin/OrderReceiptModal'
import type { OrderData } from '../../api/types'

export function OrdersSection() {
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<OrderData | null>(null)
  const [viewingOrderDetails, setViewingOrderDetails] = useState<OrderData | null>(null)
  const [editingOrder, setEditingOrder] = useState<OrderData | null>(null)
  const [noteOrder, setNoteOrder] = useState<OrderData | null>(null)
  const [adminNoteText, setAdminNoteText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders', activeTab, searchQuery],
    queryFn: () => ordersApi.getAdminOrders({ status: activeTab, search: searchQuery }),
    staleTime: 5000,
    refetchInterval: 20000,
  })

  const { data: storeSettings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => ordersApi.getAdminSettings(),
    staleTime: 30000,
  })

  const invalidateOrders = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    queryClient.invalidateQueries({ queryKey: ['admin-new-count'] })
  }

  const updateStatusMutation = useMutation({
    mutationFn: ({ number, status }: { number: string; status: string }) => ordersApi.updateOrderStatus(number, status),
    onSuccess: () => {
      invalidateOrders()
      setEditingOrder(null)
    },
    onError: (err: unknown) => {
      alert(err instanceof Error ? err.message : 'تعذّر تغيير حالة الطلب.')
    },
  })

  const updateNoteMutation = useMutation({
    mutationFn: ({ number, note }: { number: string; note: string }) => ordersApi.updateOrderNote(number, note),
    onSuccess: () => {
      invalidateOrders()
      setNoteOrder(null)
    },
    onError: () => alert('تعذّر حفظ الملاحظة.'),
  })

  const markSeenMutation = useMutation({
    mutationFn: (number: string) => ordersApi.markOrderSeen(number),
    onSuccess: invalidateOrders,
  })

  const markAllSeenMutation = useMutation({
    mutationFn: () => ordersApi.markAllOrdersSeen(),
    onSuccess: invalidateOrders,
  })

  const openOrderDetails = (order: OrderData) => {
    setViewingOrderDetails(order)
    if (!order.is_seen) markSeenMutation.mutate(order.number)
  }

  const openInvoice = async (number: string) => {
    try {
      const url = await ordersApi.fetchInvoiceObjectUrl(number)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      alert('تعذّر فتح الفاتورة، حاول مرة أخرى.')
    }
  }

  const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length
  const newCount = orders.filter((o) => !o.is_seen).length
  const approvedCount = orders.filter((o) => o.status === 'APPROVED').length
  const completedCount = orders.filter((o) => o.status === 'COMPLETED').length

  const pageSize = 10
  const totalPages = Math.ceil(orders.length / pageSize) || 1
  const paginatedOrders = orders.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const getOrderWhatsAppUrl = (order: OrderData) => {
    const isBank = order.payment_method === 'BANK_TRANSFER'
    const itemsText =
      order.items?.map((it) => `• ${it.product_name} (عدد: ${it.quantity}) = ${it.line_total} د.ل`).join('\n') || ''
    const text = isBank
      ? `🧾 *فاتورة طلب متجر H2O Floss (تحويل مصرفي)*
رقم الطلب: #${order.number}
العميل: ${order.full_name}
الهاتف: ${order.phone}
المدينة: ${order.city_name} — ${order.address}
-------------------------
المنتجات:
${itemsText}
*الإجمالي المطلوب: ${order.total} د.ل*
طريقة الدفع: تحويل مصرفي عبر واتساب
-------------------------
💳 *بيانات الحساب المصرفي:*
المصرف: ${storeSettings?.bank_name || 'مصرف الجمهورية'}
المستفيد: ${storeSettings?.bank_account_holder || 'متجر H2O Floss'}
رقم الحساب: ${storeSettings?.bank_account_number || ''}
الآيبان (IBAN): ${storeSettings?.bank_iban || ''}
-------------------------
يرجى إرسال إيصال التحويل لتأكيد الشحن فوراً.`
      : `🧾 *فاتورة طلب متجر H2O Floss (كاش عند الاستلام)*
رقم الطلب: #${order.number}
العميل: ${order.full_name}
الهاتف: ${order.phone}
المدينة: ${order.city_name} — ${order.address}
-------------------------
المنتجات:
${itemsText}
*الإجمالي المطلوب للدفع عند الاستلام: ${order.total} د.ل*
طريقة الدفع: نقداً عند الاستلام (كاش)
-------------------------
مرحباً بك! تم تسجيل طلبك وهو قيد التجهيز.`
    return `https://wa.me/${order.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">إدارة الطلبات والشحن المباشر</h1>
        <p className="mt-1 text-xs text-slate-500">لوحة الإدارة التنفيذية لمتجر H2O Floss في ليبيا</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-semibold text-slate-400">إجمالي الإيرادات المسجلة</span>
          <p className="mt-2 text-xl font-black text-slate-900 dark:text-white ltr-nums">
            {totalRevenue.toLocaleString()} <span className="text-xs font-bold text-slate-500">د.ل</span>
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs dark:border-amber-900/40 dark:bg-amber-950/20">
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">طلبات قيد المراجعة</span>
          <p className="mt-2 text-xl font-black text-amber-800 dark:text-amber-300">{pendingCount}</p>
        </div>
        <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-bold text-brand-700 dark:text-cyan-400">معتمدة وقيد التجهيز</span>
          <p className="mt-2 text-xl font-black text-brand-900 dark:text-cyan-300">{approvedCount}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">تم التوصيل والتسليم</span>
          <p className="mt-2 text-xl font-black text-emerald-800 dark:text-emerald-300">{completedCount}</p>
        </div>
      </div>

      {/* Filters + search + mark all seen */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl bg-slate-200/60 p-1 dark:bg-slate-800">
          {(['ALL', 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab)
                setCurrentPage(1)
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tab === 'ALL' && 'كافة الطلبات'}
              {tab === 'PENDING' && 'قيد المراجعة'}
              {tab === 'APPROVED' && 'تم الاعتماد'}
              {tab === 'COMPLETED' && 'مكتملة'}
              {tab === 'REJECTED' && 'ملغاة'}
            </button>
          ))}
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          {newCount > 0 && (
            <button
              type="button"
              onClick={() => markAllSeenMutation.mutate()}
              disabled={markAllSeenMutation.isPending}
              className="shrink-0 rounded-full border border-rose-300 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
            >
              تعليم {newCount} كمقروء
            </button>
          )}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="بحث برقم الطلب أو اسم العميل أو الهاتف..."
              className="w-full rounded-full border border-slate-300 bg-white py-2 ps-9 pe-4 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <Search className="absolute start-3 top-2.5 size-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3.5 text-start font-bold">رقم الطلب</th>
                <th className="px-4 py-3.5 text-start font-bold">العميل والهاتف</th>
                <th className="px-4 py-3.5 text-start font-bold">المدينة والمكان</th>
                <th className="px-4 py-3.5 text-start font-bold">طريقة الدفع</th>
                <th className="px-4 py-3.5 text-start font-bold">الإجمالي</th>
                <th className="px-4 py-3.5 text-start font-bold">الحالة</th>
                <th className="px-4 py-3.5 text-center font-bold">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="mx-auto size-6 animate-spin text-brand-700" />
                    <span className="mt-2 block text-xs">جاري تحميل الطلبات...</span>
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    لا توجد طلبات مطابقة لمعايير البحث الحالية.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const isBank = order.payment_method === 'BANK_TRANSFER'
                  return (
                    <tr
                      key={order.number}
                      className={`transition-colors ${
                        order.is_seen
                          ? 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                          : 'bg-rose-50/60 hover:bg-rose-50 dark:bg-rose-950/20 dark:hover:bg-rose-950/30'
                      }`}
                    >
                      <td className="px-4 py-3.5 font-black text-brand-900 dark:text-cyan-300 ltr-nums" dir="ltr">
                        {!order.is_seen && (
                          <span className="mb-1 inline-block rounded-full bg-rose-600 px-2 py-0.5 text-[9px] font-bold text-white" dir="rtl">
                            جديد
                          </span>
                        )}
                        <div>{order.number}</div>
                        {order.whatsapp_notifications && order.whatsapp_notifications.length > 0 && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5" dir="rtl">
                            ✓ واتساب آلي
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-900 dark:text-white block">{order.full_name}</span>
                        <span className="text-[11px] text-slate-500 ltr-nums block" dir="ltr">{order.phone}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">{order.city_name}</span>
                        <span className="text-[11px] text-slate-400 line-clamp-1">{order.address}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isBank
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-brand-100 text-brand-800 dark:bg-slate-800 dark:text-cyan-300'
                          }`}
                        >
                          <span>{isBank ? '💳 تحويل مصرفي' : '💵 كاش استلام'}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-extrabold text-slate-900 dark:text-white ltr-nums">{order.total} د.ل</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            order.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : order.status === 'APPROVED'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                              : order.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {order.status_display}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <a
                            href={getOrderWhatsAppUrl(order)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="إرسال الفاتورة للعميل عبر واتساب"
                            className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300"
                          >
                            <MessageCircle className="size-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => openInvoice(order.number)}
                            title="تحميل فاتورة PDF"
                            className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                          >
                            <Download className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openOrderDetails(order)}
                            title="عرض تفاصيل الطلب"
                            className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                          >
                            <Eye className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForReceipt(order)}
                            title="طباعة إيصال الشحن"
                            className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                          >
                            <Printer className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingOrder(order)}
                            title="تغيير الحالة"
                            className="flex size-7 items-center justify-center rounded-lg bg-brand-50 text-brand-800 hover:bg-brand-100 dark:bg-slate-800 dark:text-cyan-300"
                          >
                            <Edit className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNoteOrder(order)
                              setAdminNoteText(order.admin_notes || order.note || '')
                            }}
                            title="ملاحظات المندوب"
                            className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                          >
                            <FileText className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 p-4 dark:border-slate-800 text-xs">
            <span className="text-slate-400">
              صفحة {currentPage} من {totalPages} (إجمالي {orders.length} طلب)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="flex size-8 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-30 dark:border-slate-700"
              >
                <ChevronRight className="size-4" />
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="flex size-8 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-30 dark:border-slate-700"
              >
                <ChevronLeft className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order details modal */}
      {viewingOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs" onClick={() => setViewingOrderDetails(null)}>
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                تفاصيل الطلب: <span className="text-brand-900 dark:text-cyan-300">{viewingOrderDetails.number}</span>
              </h3>
              <button type="button" onClick={() => setViewingOrderDetails(null)} className="text-slate-400 hover:text-slate-600">
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl dark:bg-slate-800">
                <div>
                  <span className="text-slate-400">اسم العميل:</span>
                  <span className="block font-bold text-slate-900 dark:text-white">{viewingOrderDetails.full_name}</span>
                </div>
                <div>
                  <span className="text-slate-400">رقم الهاتف:</span>
                  <span className="block font-bold text-slate-900 dark:text-white ltr-nums" dir="ltr">{viewingOrderDetails.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400">المدينة والتوصيل:</span>
                  <span className="block font-bold text-slate-900 dark:text-white">
                    {viewingOrderDetails.city_name} — {viewingOrderDetails.address}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">طريقة الدفع:</span>
                  <span className="block font-bold text-brand-900 dark:text-cyan-300">
                    {viewingOrderDetails.payment_method === 'BANK_TRANSFER' ? '💳 تحويل مصرفي عبر واتساب' : '💵 نقداً عند الاستلام (كاش)'}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2">المنتجات المطلوبة:</h4>
                <div className="space-y-1.5">
                  {viewingOrderDetails.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
                      <span>{it.product_name} × {it.quantity}</span>
                      <span className="font-bold ltr-nums">{it.line_total} د.ل</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-black text-sm pt-2">
                  <span>الإجمالي:</span>
                  <span className="text-brand-900 dark:text-cyan-300 ltr-nums">{viewingOrderDetails.total} د.ل</span>
                </div>
              </div>

              {viewingOrderDetails.note && (
                <div className="bg-amber-50 p-3 rounded-xl dark:bg-amber-950/40 text-amber-900 dark:text-amber-200">
                  <span className="font-bold block">ملاحظات العميل عند الطلب:</span>
                  <p className="mt-0.5">{viewingOrderDetails.note}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => openInvoice(viewingOrderDetails.number)}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-800 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-700"
              >
                <Download className="size-3.5" />
                <span>فاتورة PDF</span>
              </button>
              <a
                href={getOrderWhatsAppUrl(viewingOrderDetails)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
              >
                <MessageCircle className="size-3.5" />
                <span>مراسلة العميل</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  setSelectedOrderForReceipt(viewingOrderDetails)
                  setViewingOrderDetails(null)
                }}
                className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
              >
                طباعة الإيصال
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status change modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs" onClick={() => setEditingOrder(null)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">تحديث حالة الطلب: {editingOrder.number}</h3>
              <button type="button" onClick={() => setEditingOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {[
                { status: 'PENDING', label: 'قيد المراجعة (Pending)' },
                { status: 'APPROVED', label: 'تم الاعتماد والتجهيز (Approved)' },
                { status: 'COMPLETED', label: 'تم التسليم بنجاح (Completed)' },
                { status: 'REJECTED', label: 'إلغاء الطلب (Rejected)' },
              ].map((s) => (
                <button
                  key={s.status}
                  type="button"
                  onClick={() => updateStatusMutation.mutate({ number: editingOrder.number, status: s.status })}
                  className={`flex w-full items-center justify-between rounded-xl p-3 text-xs font-bold transition-all ${
                    editingOrder.status === s.status
                      ? 'bg-brand-800 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  <span>{s.label}</span>
                  {editingOrder.status === s.status && <CheckCircle2 className="size-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Admin note modal */}
      {noteOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs" onClick={() => setNoteOrder(null)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">ملاحظات المندوب للطلب: {noteOrder.number}</h3>
              <button type="button" onClick={() => setNoteOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-4">
              <textarea
                rows={4}
                value={adminNoteText}
                onChange={(e) => setAdminNoteText(e.target.value)}
                placeholder="اكتب ملاحظات التوصيل، وقت الاتصال، أو حالة التحويل هنا..."
                className="w-full rounded-2xl border border-slate-300 p-3.5 text-xs focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setNoteOrder(null)} className="rounded-full border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700">
                إلغاء
              </button>
              <button
                type="button"
                disabled={updateNoteMutation.isPending}
                onClick={() => updateNoteMutation.mutate({ number: noteOrder.number, note: adminNoteText })}
                className="rounded-full bg-brand-800 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
              >
                {updateNoteMutation.isPending ? 'جاري الحفظ...' : 'حفظ الملاحظة'}
              </button>
            </div>
          </div>
        </div>
      )}

      <OrderReceiptModal order={selectedOrderForReceipt} onClose={() => setSelectedOrderForReceipt(null)} />
    </div>
  )
}

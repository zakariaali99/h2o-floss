import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit, Loader2, Plus, ShoppingBag, Trash2, X } from 'lucide-react'

import { ordersApi } from '../../api/orders'
import type { AdminProductData, ProductKind } from '../../api/types'

const emptyForm: Partial<AdminProductData> = {
  name: '',
  slug: '',
  kind: 'DEVICE',
  price: '225.00',
  old_price: '290.00',
  stock_quantity: 50,
  tagline: '',
  description: '',
  badge: 'الأكثر مبيعاً',
  is_active: true,
}

export function ProductsSection() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<AdminProductData | null>(null)
  const [form, setForm] = useState<Partial<AdminProductData>>(emptyForm)

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => ordersApi.getAdminProducts(),
    staleTime: 5000,
  })
  const products = Array.isArray(productsData) ? productsData : productsData?.results || []

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-products'] })

  // Only send the editable scalar fields — NOT read-only/computed ones like
  // main_image (a file), category, slug, currency, id … which the API rejects.
  const editablePayload = (f: Partial<AdminProductData>): Partial<AdminProductData> => ({
    name: f.name,
    kind: f.kind,
    price: f.price,
    old_price: f.old_price || null,
    stock_quantity: f.stock_quantity,
    tagline: f.tagline,
    description: f.description,
    badge: f.badge,
    is_active: f.is_active,
  })

  const saveMutation = useMutation({
    mutationFn: (payload: Partial<AdminProductData>) =>
      editingProduct?.id
        ? ordersApi.updateAdminProduct(editingProduct.id, editablePayload(payload))
        : ordersApi.createAdminProduct(editablePayload(payload)),
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
      setEditingProduct(null)
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'تعذّر حفظ المنتج.'
      alert(msg)
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => ordersApi.updateAdminProduct(id, { is_active }),
    onSuccess: invalidate,
    onError: () => alert('تعذّر تغيير حالة المنتج.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => ordersApi.deleteAdminProduct(id),
    onSuccess: invalidate,
    onError: () => alert('تعذّر حذف المنتج.'),
  })

  const openAdd = () => {
    setEditingProduct(null)
    setForm({ ...emptyForm, badge: 'جديد' })
    setModalOpen(true)
  }
  const openEdit = (prod: AdminProductData) => {
    setEditingProduct(prod)
    setForm({ ...prod })
    setModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">إدارة الكتالوج والمنتجات</h1>
          <p className="mt-1 text-xs text-slate-500">إضافة وتعديل المنتجات، الأسعار، المخزون وتفعيلها في المتجر</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-full bg-brand-800 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-700"
        >
          <Plus className="size-4" />
          <span>إضافة منتج جديد</span>
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="border-b border-slate-100 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3.5 text-start font-bold">الصورة</th>
                <th className="px-4 py-3.5 text-start font-bold">اسم المنتج</th>
                <th className="px-4 py-3.5 text-start font-bold">النوع</th>
                <th className="px-4 py-3.5 text-start font-bold">السعر الحالي</th>
                <th className="px-4 py-3.5 text-start font-bold">السعر السابق</th>
                <th className="px-4 py-3.5 text-start font-bold">المخزون</th>
                <th className="px-4 py-3.5 text-start font-bold">الحالة</th>
                <th className="px-4 py-3.5 text-center font-bold">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Loader2 className="mx-auto size-6 animate-spin text-brand-700" />
                    <span className="mt-2 block text-xs">جاري تحميل المنتجات...</span>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">لا توجد منتجات مسجلة حالياً. اضغط "إضافة منتج جديد".</td>
                </tr>
              ) : (
                products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      {prod.main_image ? (
                        <img src={prod.main_image} alt="" className="size-10 rounded-xl object-contain bg-slate-100 p-1" />
                      ) : (
                        <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                          <ShoppingBag className="size-5" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 dark:text-white block">{prod.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{prod.slug}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {prod.kind === 'DEVICE' ? 'جهاز رئيسي' : prod.kind === 'PART' ? 'قطعة غيار' : prod.kind === 'ACCESSORY' ? 'ملحق' : 'طقم'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-extrabold text-slate-900 dark:text-white ltr-nums">{prod.price} د.ل</td>
                    <td className="px-4 py-3 text-slate-400 line-through ltr-nums">{prod.old_price ? `${prod.old_price} د.ل` : '—'}</td>
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">{prod.stock_quantity}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleActiveMutation.mutate({ id: prod.id, is_active: !prod.is_active })}
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-all ${
                          prod.is_active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {prod.is_active ? 'مفعّل بالمتجر' : 'معطّل (مخفي)'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(prod)}
                          title="تعديل المنتج"
                          className="flex size-7 items-center justify-center rounded-lg bg-brand-50 text-brand-800 hover:bg-brand-100 dark:bg-slate-800 dark:text-cyan-300"
                        >
                          <Edit className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من حذف المنتج "${prod.name}"؟`)) deleteMutation.mutate(prod.id)
                          }}
                          title="حذف المنتج"
                          className="flex size-7 items-center justify-center rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="size-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                saveMutation.mutate(form)
              }}
              className="mt-4 space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300">اسم المنتج باللغة العربية</label>
                <input
                  type="text"
                  required
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="مثال: جهاز خيط الأسنان المائي H2O Floss الأصلي"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300">النوع</label>
                  <select
                    value={form.kind || 'DEVICE'}
                    onChange={(e) => setForm({ ...form, kind: e.target.value as ProductKind })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="DEVICE">جهاز رئيسي (Device)</option>
                    <option value="PART">قطعة غيار (Part)</option>
                    <option value="ACCESSORY">ملحق / رأس بديل</option>
                    <option value="KIT">باقة / طقم متكامل</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300">شارة مميزة (Badge)</label>
                  <input
                    type="text"
                    value={form.badge || ''}
                    onChange={(e) => setForm({ ...form, badge: e.target.value })}
                    placeholder="الأكثر مبيعاً"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300">السعر (د.ل)</label>
                  <input
                    type="text"
                    required
                    value={form.price || ''}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="225.00"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white ltr-nums"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300">السعر السابق للشطب</label>
                  <input
                    type="text"
                    value={form.old_price || ''}
                    onChange={(e) => setForm({ ...form, old_price: e.target.value })}
                    placeholder="290.00"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white ltr-nums"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300">كمية المخزون</label>
                  <input
                    type="number"
                    value={form.stock_quantity ?? 50}
                    onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300">شعار ترويجي مختصر (Tagline)</label>
                <input
                  type="text"
                  value={form.tagline || ''}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  placeholder="تنظيف عميق وضغط مائي احترافي"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300">وصف المنتج الكامل</label>
                <textarea
                  rows={3}
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="اكتب مواصفات المنتج ومميزاته هنا..."
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="prod_is_active"
                  checked={form.is_active ?? true}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="size-4 rounded accent-brand-800"
                />
                <label htmlFor="prod_is_active" className="font-bold text-slate-800 dark:text-slate-200">
                  تفعيل المنتج وعرضه في متجر الشراء
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-full border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700">
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="rounded-full bg-brand-800 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ المنتج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

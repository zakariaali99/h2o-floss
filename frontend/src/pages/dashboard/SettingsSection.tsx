import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, CreditCard, Loader2, MessageCircle, Send } from 'lucide-react'

import { ordersApi } from '../../api/orders'
import type { StoreSettingsData } from '../../api/types'

const inputClass =
  'mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white'

type SectionKey = 'whatsapp' | 'telegram' | 'bank'

export function SettingsSection() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<Partial<StoreSettingsData>>({})
  const [savedSection, setSavedSection] = useState<SectionKey | null>(null)

  const { data } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => ordersApi.getAdminSettings(),
    staleTime: 10000,
  })

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  const saveMutation = useMutation({
    mutationFn: ({ payload }: { payload: Partial<StoreSettingsData>; section: SectionKey }) =>
      ordersApi.updateStoreSettings(payload),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      // Merge server result but keep the other sections' in-progress edits.
      setForm((prev) => ({ ...prev, ...result }))
      setSavedSection(variables.section)
      setTimeout(() => setSavedSection((s) => (s === variables.section ? null : s)), 3000)
    },
  })

  const set = (patch: Partial<StoreSettingsData>) => setForm((f) => ({ ...f, ...patch }))
  const savingSection = saveMutation.isPending ? (saveMutation.variables?.section ?? null) : null

  const SaveButton = ({ section, label }: { section: SectionKey; label: string }) => (
    <div className="flex items-center gap-3 pt-1">
      <button
        type="submit"
        disabled={savingSection === section}
        className="inline-flex items-center gap-2 rounded-full bg-brand-800 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-700 disabled:opacity-50"
      >
        {savingSection === section ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
        <span>{savingSection === section ? 'جاري الحفظ...' : label}</span>
      </button>
      {savedSection === section && (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="size-4" /> تم الحفظ
        </span>
      )}
    </div>
  )

  const cardClass = 'rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-7 dark:border-slate-800 dark:bg-slate-900'

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">الإعدادات والإشعارات</h1>
        <p className="mt-1 text-xs text-slate-500">كل قسم يُحفظ بشكل مستقل — يمكنك تعديل بيانات المصرف مثلاً دون المساس بالباقي.</p>
      </div>

      {/* WhatsApp & managers */}
      <form
        className={cardClass}
        onSubmit={(e) => {
          e.preventDefault()
          const payload: Partial<StoreSettingsData> = {
            store_whatsapp: form.store_whatsapp,
            manager_phones: form.manager_phones,
            whatsapp_auto_send: form.whatsapp_auto_send,
            whatsapp_gateway_url: form.whatsapp_gateway_url,
          }
          if (form.whatsapp_gateway_token) payload.whatsapp_gateway_token = form.whatsapp_gateway_token
          saveMutation.mutate({ payload, section: 'whatsapp' })
        }}
      >
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
          <MessageCircle className="size-5 text-emerald-600" />
          <h3 className="text-base font-black text-slate-900 dark:text-white">الواتساب وأرقام المدراء</h3>
        </div>

        <div className="mt-5 space-y-5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300">
              رقم واتساب المتجر الرسمي (يظهر للعملاء في كل الموقع) <span className="text-rose-500">*</span>
            </label>
            <input type="text" value={form.store_whatsapp || ''} onChange={(e) => set({ store_whatsapp: e.target.value })} placeholder="218910000000" className={`${inputClass} ltr-nums`} dir="ltr" />
          </div>
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300">أرقام هواتف المدراء (افصل بينها بفاصلة)</label>
            <input type="text" value={form.manager_phones || ''} onChange={(e) => set({ manager_phones: e.target.value })} placeholder="218911111111, 218922222222" className={`${inputClass} ltr-nums`} dir="ltr" />
          </div>
          <label className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <div>
              <span className="font-extrabold text-sm text-slate-900 dark:text-white block">⚡ الإرسال التلقائي للإشعارات</span>
              <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-300">إرسال إشعار الطلب للمدراء آلياً فور إتمام كل طلب.</p>
            </div>
            <input type="checkbox" checked={form.whatsapp_auto_send ?? true} onChange={(e) => set({ whatsapp_auto_send: e.target.checked })} className="size-5 rounded accent-emerald-600" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300">رابط بوابة الواتساب / Webhook (اختياري)</label>
              <input type="text" value={form.whatsapp_gateway_url || ''} onChange={(e) => set({ whatsapp_gateway_url: e.target.value })} placeholder="http://127.0.0.1:8790/send" className={`${inputClass} ltr-nums`} dir="ltr" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300">مفتاح API Token للبوابة (اختياري)</label>
              <input type="password" value={form.whatsapp_gateway_token || ''} onChange={(e) => set({ whatsapp_gateway_token: e.target.value })} placeholder="اتركه فارغاً للإبقاء على المفتاح الحالي" className={inputClass} />
            </div>
          </div>
          <SaveButton section="whatsapp" label="حفظ إعدادات الواتساب" />
        </div>
      </form>

      {/* Telegram */}
      <form
        className={cardClass}
        onSubmit={(e) => {
          e.preventDefault()
          const payload: Partial<StoreSettingsData> = {
            telegram_enabled: form.telegram_enabled,
            telegram_chat_ids: form.telegram_chat_ids,
          }
          if (form.telegram_bot_token) payload.telegram_bot_token = form.telegram_bot_token
          saveMutation.mutate({ payload, section: 'telegram' })
        }}
      >
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
          <Send className="size-5 text-sky-500" />
          <h3 className="text-base font-black text-slate-900 dark:text-white">إشعارات تيليجرام للمدير</h3>
        </div>

        <div className="mt-5 space-y-5 text-xs">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            أنشئ بوت من @BotFather واحصل على التوكن، ثم افتح البوت من هاتف المدير وأرسل أي رسالة، ونفّذ الأمر{' '}
            <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">python manage.py telegram_get_chat_id</code> للحصول على معرّف المحادثة.
          </p>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.telegram_enabled ?? false} onChange={(e) => set({ telegram_enabled: e.target.checked })} className="size-4 rounded border-slate-300" />
            <span className="font-bold text-slate-700 dark:text-slate-300">تفعيل إشعارات تيليجرام</span>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300">توكن البوت (Bot Token)</label>
              <input type="password" value={form.telegram_bot_token || ''} onChange={(e) => set({ telegram_bot_token: e.target.value })} placeholder="اتركه فارغاً للإبقاء على التوكن الحالي" className={inputClass} dir="ltr" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300">معرّفات المحادثة (Chat IDs)</label>
              <input type="text" value={form.telegram_chat_ids || ''} onChange={(e) => set({ telegram_chat_ids: e.target.value })} placeholder="مثال: 111111111, 222222222" className={`${inputClass} ltr-nums`} dir="ltr" />
            </div>
          </div>
          <SaveButton section="telegram" label="حفظ إعدادات تيليجرام" />
        </div>
      </form>

      {/* Bank */}
      <form
        className={cardClass}
        onSubmit={(e) => {
          e.preventDefault()
          saveMutation.mutate({
            payload: {
              bank_name: form.bank_name,
              bank_account_holder: form.bank_account_holder,
              bank_account_number: form.bank_account_number,
              bank_iban: form.bank_iban,
            },
            section: 'bank',
          })
        }}
      >
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
          <CreditCard className="size-5 text-brand-700 dark:text-cyan-400" />
          <h3 className="text-base font-black text-slate-900 dark:text-white">بيانات الحساب المصرفي (للتحويل المصرفي)</h3>
        </div>

        <div className="mt-5 space-y-5 text-xs">
          <p className="text-[11px] text-slate-400">تُرسل للمدير مع كل طلب تحويل مصرفي، وتظهر على فاتورة الطلب.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300">اسم المصرف</label>
              <input type="text" value={form.bank_name || ''} onChange={(e) => set({ bank_name: e.target.value })} placeholder="مثال: مصرف الجمهورية" className={inputClass} />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300">اسم المستفيد / صاحب الحساب</label>
              <input type="text" value={form.bank_account_holder || ''} onChange={(e) => set({ bank_account_holder: e.target.value })} placeholder="متجر H2O Floss ليبيا" className={inputClass} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300">رقم الحساب المصرفي</label>
              <input type="text" value={form.bank_account_number || ''} onChange={(e) => set({ bank_account_number: e.target.value })} placeholder="001-123456-001" className={`${inputClass} ltr-nums`} dir="ltr" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300">رقم الآيبان (IBAN)</label>
              <input type="text" value={form.bank_iban || ''} onChange={(e) => set({ bank_iban: e.target.value })} placeholder="LY00001001123456001" className={`${inputClass} ltr-nums`} dir="ltr" />
            </div>
          </div>
          <SaveButton section="bank" label="حفظ بيانات المصرف" />
        </div>
      </form>
    </div>
  )
}

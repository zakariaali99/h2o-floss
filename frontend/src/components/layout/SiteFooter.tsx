import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Award, Banknote, Headset, MapPin, Phone, ShieldCheck, Truck } from 'lucide-react'

import { ordersApi } from '../../api/orders'

/** Format a raw MSISDN like 218911234567 into +218 91 123 4567 for display. */
function formatWhatsapp(raw: string): string {
  const d = raw.replace(/\D/g, '')
  if (d.startsWith('218') && d.length >= 12) {
    return `+218 ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8)}`
  }
  return raw
}

export function SiteFooter() {
  const { data: storeCfg } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => ordersApi.getStoreSettings(),
    staleTime: 60000,
  })
  const phone = formatWhatsapp(storeCfg?.store_whatsapp || '218910000000')

  return (
    <footer className="mt-20 border-t border-slate-200 bg-white text-slate-600 transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
      {/* Top Value Proposition Bar */}
      <div className="border-b border-slate-100 bg-brand-50/50 py-8 dark:border-slate-800/60 dark:bg-slate-900/40">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
          <div className="flex items-center gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-800 dark:bg-slate-800 dark:text-cyan-400">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">أصلي ومضمون 100%</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">مطابق للمواصفات الطبية المعتمدة</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-800 dark:bg-slate-800 dark:text-cyan-400">
              <Truck className="size-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">شحن وتوصيل سريع</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">شحن لكافة المدن والمناطق الليبية</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-800 dark:bg-slate-800 dark:text-cyan-400">
              <Banknote className="size-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">الدفع كاش عند الاستلام</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">عاين جهازك وتأكد منه قبل السداد</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-800 dark:bg-slate-800 dark:text-cyan-400">
              <Award className="size-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">جودة عالمية معتمدة</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">مطابق لمواصفات CE و FDA الدولية</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          {/* Brand Col */}
          <div className="md:col-span-2">
            <div className="flex items-center">
              <img src="/brand/logo.png" alt="H2O Floss ليبيا" className="block h-10 w-auto dark:hidden" />
              <img src="/brand/logo-white.png" alt="H2O Floss ليبيا" className="hidden h-10 w-auto dark:block" />
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              منصة معتمدة من شركة H2O Floss العالمية في ليبيا. تقنية النبضات المائية المتقدمة
              لإزالة البلاك وحماية اللثة والتخلص من بقايا الطعام بفاعلية ولطف.
            </p>
            <div className="mt-4 flex flex-col gap-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-brand-600 dark:text-cyan-400" />
                <span>ليبيا — التوزيع والتوصيل لجميع المدن</span>
              </div>
              <a
                href={`https://wa.me/${(storeCfg?.store_whatsapp || '218910000000').replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                <Phone className="size-4 text-brand-600 dark:text-cyan-400" />
                <span className="ltr-nums font-semibold" dir="ltr">{phone}</span>
              </a>
              <div className="flex items-center gap-2">
                <Headset className="size-4 text-brand-600 dark:text-cyan-400" />
                <span>خدمة العملاء متوفرة يومياً عبر واتساب والهاتف</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold tracking-wider text-slate-900 dark:text-white">روابط المتجر</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link to="/" className="transition-colors hover:text-brand-600 dark:hover:text-cyan-400">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link to="/product/h2o-floss" className="transition-colors hover:text-brand-600 dark:hover:text-cyan-400">
                  جهاز H2O Floss الأصلي
                </Link>
              </li>
              <li>
                <Link to="/track" className="transition-colors hover:text-brand-600 dark:hover:text-cyan-400">
                  تتبع حالة الطلب
                </Link>
              </li>
              <li>
                <Link to="/cart" className="transition-colors hover:text-brand-600 dark:hover:text-cyan-400">
                  سلة المشتريات
                </Link>
              </li>
            </ul>
          </div>

          {/* Specs / Features */}
          <div>
            <h4 className="text-sm font-bold tracking-wider text-slate-900 dark:text-white">مواصفات الجهاز</h4>
            <ul className="mt-4 space-y-2.5 text-xs text-slate-500 dark:text-slate-400">
              <li className="flex items-center justify-between">
                <span>سعة الخزان:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">300 مل</span>
              </li>
              <li className="flex items-center justify-between">
                <span>أوضاع الضخ:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">5 أوضاع ذكية</span>
              </li>
              <li className="flex items-center justify-between">
                <span>قوة البطارية:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">2500 mAh</span>
              </li>
              <li className="flex items-center justify-between">
                <span>مقاومة الماء:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">معيار IPX7</span>
              </li>
              <li className="flex items-center justify-between">
                <span>الرؤوس المرفقة:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">6 رؤوس متخصصة</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 text-xs text-slate-400 sm:flex-row dark:border-slate-800/80">
          <p>© {new Date().getFullYear()} H2O Floss ليبيا — جميع الحقوق محفوظة.</p>
          <p className="ltr-nums text-[11px] text-slate-400">H2O Floss Oral Care · Libya Edition</p>
        </div>
      </div>
    </footer>
  )
}

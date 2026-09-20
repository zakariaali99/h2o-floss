import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ShoppingBag, X } from 'lucide-react'

import { ordersApi } from '../../api/orders'
import { lead } from '../../lib/pixel'

const ORDER_STORAGE_KEY = 'h2o.floatingCTA.orderDismissed'
const WHATSAPP_STORAGE_KEY = 'h2o.floatingCTA.whatsappDismissed'

export function FloatingOrderCTA() {
  const location = useLocation()
  const pathname = location.pathname.toLowerCase()

  const { data: storeCfg } = useQuery({
    queryKey: ['store-settings'],
    queryFn: () => ordersApi.getStoreSettings(),
    staleTime: 60000,
  })

  const whatsappDigits = storeCfg?.store_whatsapp ? storeCfg.store_whatsapp.replace(/\D/g, '') : ''

  const [orderDismissed, setOrderDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(ORDER_STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  const [whatsappDismissed, setWhatsappDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(WHATSAPP_STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  const [isVisible, setIsVisible] = useState(false)

  // Never shown on cart, checkout, order/*, track, admin-*, dashboard*, login
  const isExcluded = [
    '/cart',
    '/checkout',
    '/order',
    '/track',
    '/admin',
    '/dashboard',
    '/login',
  ].some((prefix) => pathname.startsWith(prefix))

  useEffect(() => {
    if (isExcluded || (orderDismissed && whatsappDismissed)) {
      setIsVisible(false)
      return
    }

    let rafId: number | null = null

    const checkScroll = () => {
      rafId = null
      const scrollY = window.scrollY || window.pageYOffset || 0
      const scrollHeight = document.documentElement.scrollHeight
      const innerHeight = window.innerHeight
      const scrollBottom = scrollHeight - (scrollY + innerHeight)

      // Past 350px (past hero) and not within 150px of page bottom
      const shouldShow = scrollY > 350 && scrollBottom >= 150
      setIsVisible(shouldShow)
    }

    const onScroll = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(checkScroll)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    checkScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId)
      }
    }
  }, [isExcluded, orderDismissed, whatsappDismissed, location.pathname])

  if (isExcluded || (orderDismissed && whatsappDismissed)) {
    return null
  }

  const handleDismissOrder = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      sessionStorage.setItem(ORDER_STORAGE_KEY, '1')
    } catch {
      // ignore storage access errors
    }
    setOrderDismissed(true)
  }

  const handleDismissWhatsapp = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      sessionStorage.setItem(WHATSAPP_STORAGE_KEY, '1')
    } catch {
      // ignore storage access errors
    }
    setWhatsappDismissed(true)
  }

  const handleWhatsappClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!whatsappDigits) return
    lead('whatsapp_floating')
    const message = 'السلام عليكم، أرغب بطلب جهاز H2O Floss للتنظيف المائي.'
    window.open(
      `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  return (
    <div
      aria-hidden={!isVisible}
      className={`fixed bottom-6 end-6 z-40 flex flex-col items-end gap-2.5 transition-all duration-300 ease-out motion-reduce:transform-none ${
        isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      {/* Floating WhatsApp Button (Matches Order Button structure and sizing) */}
      {!whatsappDismissed && (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleWhatsappClick}
            tabIndex={isVisible ? 0 : -1}
            aria-label="اطلب عبر واتساب"
            title="اطلب عبر واتساب"
            disabled={!whatsappDigits}
            className="group relative flex min-w-[125px] sm:min-w-[135px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-white shadow-xl shadow-emerald-900/30 transition-all duration-300 hover:scale-105 hover:from-emerald-400 hover:to-emerald-500 hover:shadow-emerald-900/50 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer sm:px-5 sm:py-3.5"
          >
            <svg
              className="size-5 shrink-0 fill-current transition-transform duration-300 group-hover:-translate-y-0.5"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M20.52 3.48A11.93 11.93 0 0 0 12.04 0C5.43 0 .07 5.37.07 11.97c0 2.11.55 4.17 1.6 5.99L0 24l6.22-1.63a11.95 11.95 0 0 0 5.82 1.5h.01c6.6 0 11.97-5.37 11.97-11.97 0-3.2-1.25-6.21-3.5-8.42zM12.05 21.87h-.01a9.93 9.93 0 0 1-5.07-1.39l-.36-.22-3.76.99 1-3.66-.24-.38a9.93 9.93 0 0 1-1.52-5.24c0-5.49 4.47-9.96 9.97-9.96 2.66 0 5.16 1.04 7.04 2.92a9.92 9.92 0 0 1 2.92 7.05c0 5.5-4.47 9.96-9.97 9.96zm5.46-7.46c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.78.98-.95 1.18-.18.2-.35.23-.65.08-.3-.15-1.27-.47-2.42-1.49-.9-.8-1.5-1.78-1.67-2.08-.18-.3-.02-.46.13-.61.14-.13.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.64-.93-2.25-.24-.59-.49-.51-.68-.52h-.58c-.2 0-.53.08-.8.38-.28.3-1.05 1.03-1.05 2.51s1.08 2.92 1.23 3.12c.15.2 2.12 3.24 5.14 4.54.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.08-.13-.28-.2-.58-.35z" />
            </svg>
            <span className="font-bold text-xs sm:text-sm whitespace-nowrap">
              اطلب واتساب
            </span>
          </button>

          <button
            type="button"
            onClick={handleDismissWhatsapp}
            tabIndex={isVisible ? 0 : -1}
            aria-label="إغلاق زر واتساب"
            title="إغلاق"
            className="flex size-8.5 sm:size-9 items-center justify-center rounded-full bg-slate-900/70 text-white backdrop-blur-md transition-all hover:bg-slate-900 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:bg-slate-800/80 dark:hover:bg-slate-700 cursor-pointer"
          >
            <X className="size-3.5 sm:size-4" />
          </button>
        </div>
      )}

      {/* Floating Direct Order Button */}
      {!orderDismissed && (
        <div className="flex items-center gap-1.5">
          <Link
            to="/product/h2o-floss"
            aria-label="اطلب الجهاز الآن"
            tabIndex={isVisible ? 0 : -1}
            className="group relative flex min-w-[125px] sm:min-w-[135px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-800 to-brand-900 px-4 py-3 text-white shadow-xl shadow-brand-900/30 transition-all duration-300 hover:scale-105 hover:from-brand-700 hover:to-brand-800 hover:shadow-brand-900/50 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:from-brand-600 dark:to-cyan-600 sm:px-5 sm:py-3.5"
          >
            <ShoppingBag className="size-5 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5" />
            <span className="font-bold text-xs sm:text-sm whitespace-nowrap">
              اطلب الآن
            </span>
          </Link>

          <button
            type="button"
            onClick={handleDismissOrder}
            tabIndex={isVisible ? 0 : -1}
            aria-label="إغلاق زر الطلب"
            title="إغلاق"
            className="flex size-8.5 sm:size-9 items-center justify-center rounded-full bg-slate-900/70 text-white backdrop-blur-md transition-all hover:bg-slate-900 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-slate-800/80 dark:hover:bg-slate-700 cursor-pointer"
          >
            <X className="size-3.5 sm:size-4" />
          </button>
        </div>
      )}
    </div>
  )
}

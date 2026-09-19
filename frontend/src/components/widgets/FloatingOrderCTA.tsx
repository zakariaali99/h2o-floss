import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ShoppingBag, X } from 'lucide-react'

const STORAGE_KEY = 'h2o.floatingCTA.dismissed'

export function FloatingOrderCTA() {
  const location = useLocation()
  const pathname = location.pathname.toLowerCase()

  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === '1'
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
    if (isExcluded || dismissed) {
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

      // Past 600px (roughly past hero) and not within 200px of page bottom
      const shouldShow = scrollY > 600 && scrollBottom >= 200
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
  }, [isExcluded, dismissed, location.pathname])

  if (isExcluded || dismissed) {
    return null
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ignore storage access errors
    }
    setDismissed(true)
  }

  return (
    <div
      aria-hidden={!isVisible}
      className={`fixed bottom-6 end-6 z-40 flex items-center gap-1.5 transition-all duration-300 ease-out motion-reduce:transform-none ${
        isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <Link
        to="/product/h2o-floss"
        aria-label="اطلب الجهاز الآن"
        tabIndex={isVisible ? 0 : -1}
        className="group relative flex items-center gap-2 rounded-full bg-brand-800 px-3.5 py-3.5 text-white shadow-xl shadow-brand-900/30 transition-all hover:bg-brand-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:bg-brand-600 dark:hover:bg-brand-500 sm:px-5 sm:py-3.5"
      >
        <ShoppingBag className="size-5 shrink-0 transition-transform group-hover:-translate-y-0.5" />
        <span className="hidden font-bold text-sm sm:inline group-hover:inline group-active:inline whitespace-nowrap">
          اطلب الآن
        </span>
      </Link>

      <button
        type="button"
        onClick={handleDismiss}
        tabIndex={isVisible ? 0 : -1}
        aria-label="إغلاق الزر العائم"
        title="إغلاق"
        className="flex size-9 items-center justify-center rounded-full bg-slate-900/70 text-white backdrop-blur-md transition-all hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-slate-800/80 dark:hover:bg-slate-700 cursor-pointer"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

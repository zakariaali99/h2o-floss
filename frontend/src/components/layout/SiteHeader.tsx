import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, ShoppingBag, X } from 'lucide-react'

import { ThemeToggle } from './ThemeToggle'
import { useCartStore } from '../../features/cart/store'

const links = [
  { to: '/', label: 'الرئيسية' },
  { to: '/product/h2o-floss', label: 'جهاز H2O Floss' },
  { to: '/3d-experience', label: 'تجربة 3D 🚀' },
  { to: '/track', label: 'تتبع الطلب' },
  { to: '/contact', label: 'اتصل بنا' },
]

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const cartCount = useCartStore((state) => state.itemCount())

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Brand Logo */}
        <Link
          to="/"
          className="group flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-xl"
          onClick={() => setMobileMenuOpen(false)}
        >
          <img
            src="/brand/logo.png"
            alt="H2O Floss ليبيا"
            className="block h-9 w-auto transition-transform group-hover:scale-105 dark:hidden sm:h-10"
          />
          <img
            src="/brand/logo-white.png"
            alt="H2O Floss ليبيا"
            className="hidden h-9 w-auto transition-transform group-hover:scale-105 dark:block sm:h-10"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-50 text-brand-800 dark:bg-slate-800 dark:text-cyan-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          <Link
            to="/cart"
            aria-label="سلة الشراء"
            className="relative flex items-center gap-2 rounded-full bg-brand-800 px-4.5 py-2 text-sm font-bold text-white shadow-sm shadow-brand-900/20 transition-all hover:bg-brand-700 hover:shadow-md active:scale-95 dark:bg-brand-600 dark:hover:bg-brand-500"
          >
            <ShoppingBag className="size-4 text-cyan-200" />
            <span className="hidden sm:inline">السلة</span>
            {cartCount > 0 && (
              <motion.span
                key={cartCount}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="flex size-5 items-center justify-center rounded-full bg-cyan-400 text-[11px] font-black text-brand-950 ltr-nums"
              >
                {cartCount}
              </motion.span>
            )}
          </Link>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="القائمة البرمجية"
            className="flex size-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100 md:hidden dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
    </header>

    {/* Mobile side drawer — rendered outside the header so its stacking context isn't trapped */}
    {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
          <nav className="absolute inset-y-0 end-0 flex w-72 max-w-[85%] flex-col border-s border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <img src="/brand/logo.png" alt="H2O Floss" className="block h-7 w-auto dark:hidden" />
              <img src="/brand/logo-white.png" alt="H2O Floss" className="hidden h-7 w-auto dark:block" />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="إغلاق القائمة"
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-800 dark:bg-slate-800 dark:text-cyan-300'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </nav>
        </div>
      )}
    </>
  )
}

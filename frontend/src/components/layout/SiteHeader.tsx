import { Link, NavLink } from 'react-router-dom'

import { ThemeToggle } from './ThemeToggle'

const links = [
  { to: '/', label: 'الرئيسية' },
  { to: '/product/h2o-floss', label: 'المنتج' },
  { to: '/parts', label: 'الأجزاء والملحقات' },
  { to: '/track', label: 'تتبع طلبك' },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-brand-800 text-sm font-bold text-white">
            H2O
          </span>
          <span className="text-lg font-extrabold tracking-tight text-brand-800 dark:text-brand-200">
            H2O Floss
          </span>
        </Link>

        <nav className="mx-auto hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-800 dark:bg-slate-800 dark:text-brand-200'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2 md:ms-0">
          <ThemeToggle />
          <Link
            to="/cart"
            className="rounded-full bg-brand-800 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-700"
          >
            السلة
          </Link>
        </div>
      </div>
    </header>
  )
}

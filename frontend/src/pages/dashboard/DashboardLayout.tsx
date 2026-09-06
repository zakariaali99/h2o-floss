import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { LayoutDashboard, LogOut, Menu, Settings, ShoppingBag, Users, X } from 'lucide-react'

import { setOnAuthLost } from '../../api/client'
import { ordersApi } from '../../api/orders'
import { useAuthStore } from '../../features/auth/authStore'
import { ThemeToggle } from '../../components/layout/ThemeToggle'

const navItems = [
  { to: '/dashboard', end: true, label: 'الطلبات والشحن', icon: LayoutDashboard },
  { to: '/dashboard/products', end: false, label: 'المنتجات والكتالوج', icon: ShoppingBag },
  { to: '/dashboard/customers', end: false, label: 'سجل العملاء', icon: Users },
  { to: '/dashboard/settings', end: false, label: 'الإعدادات والإشعارات', icon: Settings },
]

export function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    setOnAuthLost(() => {
      useAuthStore.getState().logout()
      navigate('/admin-login', { replace: true })
    })
    return () => setOnAuthLost(null)
  }, [navigate])

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  const { data: newCount = 0 } = useQuery({
    queryKey: ['admin-new-count'],
    queryFn: () => ordersApi.getNewOrdersCount(),
    refetchInterval: 20000,
    staleTime: 10000,
  })

  const handleLogout = () => {
    logout()
    navigate('/admin-login', { replace: true })
  }

  const linkClass = (isActive: boolean) =>
    `flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
      isActive
        ? 'bg-brand-50 text-brand-800 dark:bg-slate-800 dark:text-cyan-300'
        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
    }`

  // Shared sidebar body (used by both the desktop rail and the mobile drawer).
  const SidebarBody = (
    <>
      <div className="px-2 py-3 border-b border-slate-100 dark:border-slate-800">
        <img src="/brand/logo.png" alt="H2O Floss ليبيا" className="block h-9 w-auto dark:hidden" />
        <img src="/brand/logo-white.png" alt="H2O Floss ليبيا" className="hidden h-9 w-auto dark:block" />
        <span className="mt-2 block text-[10px] text-slate-400">لوحة التحكم التنفيذية</span>
      </div>

      <nav className="mt-6 space-y-1.5">
        {navItems.map(({ to, end, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => linkClass(isActive)}>
            <Icon className="size-4" />
            <span>{label}</span>
            {to === '/dashboard' && newCount > 0 && (
              <span className="ms-auto animate-pulse rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                {newCount} جديد
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-slate-100 pt-4 dark:border-slate-800">
        <div className="mb-3 flex items-center justify-between px-2">
          <span className="text-[11px] font-bold text-slate-500 truncate">{user?.name || user?.email}</span>
          <ThemeToggle />
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
        >
          <LogOut className="size-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0a2540] dark:bg-slate-950 dark:text-slate-100 flex">
      {/* Desktop rail */}
      <aside className="hidden lg:flex flex-col w-64 border-e border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shrink-0">
        {SidebarBody}
      </aside>

      {/* Mobile slide-in drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 end-0 flex w-72 max-w-[85%] flex-col border-s border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in slide-in-from-right duration-200">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="إغلاق القائمة"
              className="absolute start-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="size-5" />
            </button>
            {SidebarBody}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar with hamburger */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur px-4 py-3 dark:border-slate-800 dark:bg-slate-900/95">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="فتح القائمة"
            className="relative flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
          >
            <Menu className="size-5" />
            {newCount > 0 && (
              <span className="absolute -end-1 -top-1 flex size-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white">
                {newCount}
              </span>
            )}
          </button>
          <img src="/brand/logo.png" alt="H2O Floss" className="block h-7 w-auto dark:hidden" />
          <img src="/brand/logo-white.png" alt="H2O Floss" className="hidden h-7 w-auto dark:block" />
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

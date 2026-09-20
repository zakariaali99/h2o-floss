import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { setOnAuthLost } from '../api/client'
import { useAuthStore } from '../features/auth/authStore'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { ScrollToTop } from '../components/system/ScrollToTop'
import { FloatingOrderCTA } from '../components/widgets/FloatingOrderCTA'
import { pageView } from '../lib/pixel'

export function RootLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  // Fire Meta Pixel PageView on every route navigation
  useEffect(() => {
    pageView()
  }, [location.pathname])

  // When a token silently expires and refresh fails, drop the session and
  // send the admin back to the login screen.
  useEffect(() => {
    setOnAuthLost(() => {
      useAuthStore.getState().logout()
      navigate('/admin-login', { replace: true })
    })
    return () => setOnAuthLost(null)
  }, [navigate])

  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollToTop />
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <FloatingOrderCTA />
      <SiteFooter />
    </div>
  )
}

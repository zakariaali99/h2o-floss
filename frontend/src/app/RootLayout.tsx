import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

import { setOnAuthLost } from '../api/client'
import { useAuthStore } from '../features/auth/authStore'
import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'

export function RootLayout() {
  const navigate = useNavigate()

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
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}

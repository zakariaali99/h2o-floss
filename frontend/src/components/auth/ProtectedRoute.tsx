import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/authStore'
import { tokenStore } from '../../api/token'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const location = useLocation()

  // Require BOTH the auth flag and a real access token. A stale session from before
  // real auth (flag set, no token) would otherwise land on an empty, broken dashboard.
  if (!isAuthenticated || !tokenStore.getAccess()) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

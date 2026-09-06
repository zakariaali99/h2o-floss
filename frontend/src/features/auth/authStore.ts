import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { api } from '../../api/client'
import { tokenStore } from '../../api/token'

interface AdminUser {
  email: string
  username: string
  name: string
  role: string
  is_staff?: boolean
  is_superuser?: boolean
}

interface LoginResponse {
  access: string
  refresh: string
  user: AdminUser
}

interface AuthState {
  isAuthenticated: boolean
  user: AdminUser | null
  /** Authenticate against the backend. Resolves true on success. */
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: async (email, password) => {
        try {
          const data = await api.post<LoginResponse>('/auth/login/', { email, password })
          tokenStore.set(data.access, data.refresh)
          set({ isAuthenticated: true, user: data.user })
          return true
        } catch {
          tokenStore.clear()
          set({ isAuthenticated: false, user: null })
          return false
        }
      },
      logout: () => {
        tokenStore.clear()
        set({ isAuthenticated: false, user: null })
      },
    }),
    {
      name: 'h2o-floss-admin-auth',
      // Persist only the user profile; tokens live in tokenStore.
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated, user: state.user }),
    },
  ),
)

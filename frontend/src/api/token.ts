/** Admin JWT storage, shared by the auth store and the fetch client. */

const ACCESS_KEY = 'h2o_admin_access'
const REFRESH_KEY = 'h2o_admin_refresh'

export const tokenStore = {
  getAccess(): string | null {
    try {
      return localStorage.getItem(ACCESS_KEY)
    } catch {
      return null
    }
  },
  getRefresh(): string | null {
    try {
      return localStorage.getItem(REFRESH_KEY)
    } catch {
      return null
    }
  },
  set(access: string, refresh?: string) {
    try {
      localStorage.setItem(ACCESS_KEY, access)
      if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
    } catch {
      /* private mode */
    }
  },
  clear() {
    try {
      localStorage.removeItem(ACCESS_KEY)
      localStorage.removeItem(REFRESH_KEY)
    } catch {
      /* private mode */
    }
  },
}

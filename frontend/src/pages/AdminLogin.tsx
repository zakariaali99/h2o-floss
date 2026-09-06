import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Lock, Mail } from 'lucide-react'
import { useAuthStore } from '../features/auth/authStore'

export function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/dashboard'

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور.')
      return
    }

    setSubmitting(true)
    const success = await login(email.trim().toLowerCase(), password)
    setSubmitting(false)

    if (success) {
      navigate(from, { replace: true })
    } else {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة، أو أن الحساب لا يملك صلاحية إدارية.')
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 py-16 bg-[#f8fafc] dark:bg-slate-950">
      <div className="w-full max-w-md rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-10">
        {/* Header Branding */}
        <div className="text-center">
          <img src="/brand/logo.png" alt="H2O Floss ليبيا" className="mx-auto block h-12 w-auto dark:hidden" />
          <img src="/brand/logo-white.png" alt="H2O Floss ليبيا" className="mx-auto hidden h-12 w-auto dark:block" />
          <h2 className="mt-5 text-2xl font-black text-slate-900 dark:text-white">
            تسجيل دخول لوحة التحكم
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            الدخول مخصص لموظفي وإدارة متجر H2O Floss
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-6 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-bold text-rose-800 dark:bg-rose-950/60 dark:border-rose-900 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@h2ofloss.ly"
                dir="ltr"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 ps-10 pe-4 text-xs font-semibold text-slate-900 focus:border-brand-600 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              كلمة المرور
            </label>
            <div className="relative">
              <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 ps-10 pe-4 text-xs font-semibold text-slate-900 focus:border-brand-600 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-gradient-to-r from-brand-800 to-brand-900 py-3.5 text-xs font-bold text-white shadow-lg shadow-brand-900/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:hover:scale-100 dark:from-brand-600 dark:to-cyan-600"
          >
            {submitting ? 'جارٍ التحقق…' : 'دخول لوحة الإدارة'}
          </button>
        </form>
      </div>
    </div>
  )
}

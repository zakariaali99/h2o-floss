import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

const KEY = 'h2o-theme'

export function ThemeToggle() {
  const [dark, setDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem(KEY, dark ? 'dark' : 'light')
    } catch {
      /* storage blocked */
    }
  }, [dark])

  return (
    <button
      type="button"
      onClick={() => setDark((value) => !value)}
      aria-label={dark ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
      title={dark ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
      className="relative flex size-9.5 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-xs transition-all hover:border-brand-300 hover:bg-slate-50 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-white"
    >
      {dark ? (
        <Sun className="size-4.5 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="size-4.5 text-slate-700 transition-transform duration-300 hover:-rotate-12 dark:text-slate-300" />
      )}
    </button>
  )
}

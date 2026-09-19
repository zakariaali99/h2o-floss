import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * Scrolls the window to the top on every route change, EXCEPT when the
 * navigation is a Back/Forward pop — in that case we preserve the
 * browser's own restored scroll position so the user returns to where
 * they were.
 *
 * Also honors `#hash` targets: if the URL has a hash, we jump to that
 * element instead of the top.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation()
  const navType = useNavigationType()

  useEffect(() => {
    if (navType === 'POP') return // browser Back/Forward — leave it alone

    if (hash) {
      // Wait a tick so the new route's DOM has rendered
      const id = hash.slice(1)
      requestAnimationFrame(() => {
        const el = document.getElementById(id)
        if (el) {
          el.scrollIntoView({ behavior: 'auto', block: 'start' })
          return
        }
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      })
      return
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, hash, navType])

  return null
}

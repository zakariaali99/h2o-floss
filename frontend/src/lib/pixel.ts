/**
 * Meta (Facebook) Pixel integration with standard ecommerce events.
 * Safe no-op when VITE_META_PIXEL_ID is empty or absent.
 */

interface FbqFunction {
  (...args: unknown[]): void
  callMethod?: (...args: unknown[]) => void
  queue?: unknown[]
  loaded?: boolean
  version?: string
}

declare global {
  interface Window {
    fbq?: FbqFunction
    _fbq?: unknown
  }
}

const rawPixelId = (import.meta.env.VITE_META_PIXEL_ID as string | undefined)?.trim()
const enabled = typeof window !== 'undefined' && Boolean(rawPixelId)

if (enabled && rawPixelId) {
  try {
    if (!window.fbq) {
      const fbq: FbqFunction = function (...args: unknown[]) {
        if (fbq.callMethod) {
          fbq.callMethod.apply(fbq, args)
        } else {
          fbq.queue?.push(args)
        }
      }
      fbq.queue = []
      fbq.loaded = true
      fbq.version = '2.0'
      window.fbq = fbq
      window._fbq = fbq

      const script = document.createElement('script')
      script.async = true
      script.src = 'https://connect.facebook.net/en_US/fbevents.js'
      const firstScript = document.getElementsByTagName('script')[0]
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript)
      } else {
        document.head.appendChild(script)
      }
    }

    window.fbq('init', rawPixelId)
  } catch {
    // Pixel blocked or DOM inaccessible — silently fail
  }
}

export function pageView(): void {
  if (!enabled) return
  try {
    window.fbq?.('track', 'PageView')
  } catch {
    // ignore
  }
}

export function viewContent(p: { id: string | number; name: string; price: number }): void {
  if (!enabled) return
  try {
    window.fbq?.('track', 'ViewContent', {
      content_ids: [p.id],
      content_name: p.name,
      content_type: 'product',
      value: p.price,
      currency: 'LYD',
    })
  } catch {
    // ignore
  }
}

export function addToCart(p: { id: string | number; name: string; price: number; quantity: number }): void {
  if (!enabled) return
  try {
    window.fbq?.('track', 'AddToCart', {
      content_ids: [p.id],
      content_name: p.name,
      value: p.price * p.quantity,
      currency: 'LYD',
    })
  } catch {
    // ignore
  }
}

export function initiateCheckout(value: number): void {
  if (!enabled) return
  try {
    window.fbq?.('track', 'InitiateCheckout', {
      value,
      currency: 'LYD',
    })
  } catch {
    // ignore
  }
}

export function purchase(value: number, orderNumber: string): void {
  if (!enabled) return
  try {
    window.fbq?.('track', 'Purchase', {
      value,
      currency: 'LYD',
      content_type: 'product',
    })
    if (import.meta.env.DEV) {
      console.debug(`[MetaPixel] Purchase: #${orderNumber} (${value} LYD)`)
    }
  } catch {
    // ignore
  }
}

export function lead(source: string): void {
  if (!enabled) return
  try {
    window.fbq?.('track', 'Lead', {
      content_name: source,
    })
  } catch {
    // ignore
  }
}

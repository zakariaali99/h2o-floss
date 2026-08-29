/** Build-time configuration, all overridable through .env.local (see .env.example). */
const env = import.meta.env

export const config = {
  apiBase: (env.VITE_API_BASE as string | undefined) ?? '/api/v1',
  productVideoUrl:
    (env.VITE_PRODUCT_VIDEO_URL as string | undefined) ??
    'https://h2ofloss.com/cdn/shop/videos/c/vp/274294f49a9b462ea8694352408c47e5/274294f49a9b462ea8694352408c47e5.HD-1080p-7.2Mbps-43755982.mp4',
  /** Empty string means "not configured" — the WhatsApp button stays hidden. */
  whatsappNumber: (env.VITE_WHATSAPP_NUMBER as string | undefined) ?? '',
} as const

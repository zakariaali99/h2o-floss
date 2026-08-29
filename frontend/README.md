# H2O Floss storefront

React 19 + Vite + TypeScript (strict) + Tailwind CSS 4. Arabic, `dir="rtl"`, dark mode via `<html class="dark">`.

```
src/app/router.tsx          route table            src/api/client.ts    typed fetch + ApiError envelope
src/app/RootLayout.tsx      header/footer shell    src/api/types.ts     API response types
src/components/layout/      header, footer, theme  src/config.ts        VITE_* env access
src/pages/                  one file per route     src/styles/index.css Tailwind import + brand tokens
```

## Scripts

```bash
npm run dev        # http://127.0.0.1:5173  (proxies /api,/media,/static,/admin → Django)
npm run build      # tsc --noEmit && vite build
npm run preview    # serve the production bundle
VITE_BACKEND_ORIGIN=http://127.0.0.1:8017 npm run dev
```

## Rules

- RTL by default: use Tailwind logical utilities (`ms-`, `me-`, `ps-`, `text-start`). Wrap phone numbers
  and `wa.me` links in `.ltr-nums` so bidi never mangles them.
- No CDN scripts, no Bootstrap, no browser Babel — everything is bundled.
- Prices/currency come from `/api/v1/config/`; never hard-code `د.ل` in a component.
- Cart mutations are POST/PATCH/DELETE through the API client, optimistic via TanStack Query.

## Env (`.env.local`, all optional)

| Var | Default |
|---|---|
| `VITE_API_BASE` | `/api/v1` |
| `VITE_PRODUCT_VIDEO_URL` | h2ofloss.com CDN clip — drop a file in `public/video/` and point here instead |
| `VITE_WHATSAPP_NUMBER` | empty → WhatsApp buttons hidden |

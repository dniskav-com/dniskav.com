# dniskav.com — apps/web

Portfolio personal de Daniel Silva ([dniskav.com](https://www.dniskav.com)).
Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + next-intl (en/es).
Deploy self-hosted en Hetzner — **no usa Vercel**.

## Desarrollo

```bash
bun install
bun run dev     # http://localhost:3000
bun run build   # build de producción (Turbopack)
bun run lint
```

Requiere `GEMINI_API_KEY` en `.env.local` solo para `/api/chat`.

## Estructura

- `src/app/[locale]/` — páginas (en/es via next-intl)
- `src/app/api/chat/` — chat IA (Gemini), con rate limit y límites de tamaño
- `src/app/api/og/` — imagen OG dinámica (edge)
- `src/components/` — UI, 3D (Three.js/R3F), contenido
- `src/content/posts/` — blog en MDX

## Deploy

Automático en push a `master` (`.github/workflows/deploy.yml`):
SSH al VPS → `git reset --hard` → `bun install` + `build` →
`systemctl restart dniskav`.

## Seguridad

Ver `AGENTS.md` en la raíz del repo (invariantes: límites del chat API,
cabeceras en Caddy, usuario systemd dedicado, secrets) y `SECURITY.md`
para reportar vulnerabilidades. Contexto del sitio: `SITE_CONTEXT.md`.

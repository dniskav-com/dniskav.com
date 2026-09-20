# Portfolio dniskav.com — guía para agentes de IA

Next.js 16 (App Router) + next-intl, desplegado en Hetzner con Caddy.
Última auditoría de seguridad: **2026-09-20**. Los cambios marcados con
**[seguridad]** son invariantes: no revertirlos sin entender por qué existen.

## Estructura

```
/srv/dniskav/            repo git (branch master) — migrado fuera de /root
  apps/web/              el sitio (Next.js, Turbopack)
    src/app/api/chat/    chat IA (Gemini) — ver límites abajo
    src/app/api/og/      OG image (edge, sin input de usuario)
    next.config.ts
  .github/workflows/deploy.yml   deploy al VPS en cada push a master
```

## Producción

- **Servicio**: `systemd` unit `dniskav.service`, corre como usuario
  **dedicado `dniskav`** (NO como root) con sandboxing
  (`ProtectHome=true`, `ProtectSystem=full`, etc.).
- **Puerto**: 3000, solo accesible por Caddy (`www.dniskav.com`) o localhost.
- **Secrets**: `GEMINI_API_KEY` vive en `/etc/dniskav.env` (chmod 600, root).
  NO volver a ponerla inline en el unit ni commitearla.
- **Deploy (CI)**: push a `master` → SSH al VPS → `git reset --hard` →
  `bun install` + `bun run build` en `apps/web` → `chown -R dniskav` →
  `systemctl restart dniskav`. El repo en el VPS es propiedad de `dniskav`;
  root puede operar git gracias a `safe.directory`.
- **Bun**: binario compartido en `/usr/local/bin/bun` (no el de `~/.bun`,
  oculto por ProtectHome).

## Invariantes de seguridad

1. **`/api/chat` tiene límites [seguridad]**: rate limit 10 req/min/IP en
   memoria, `message` ≤ 1000 chars, `history` ≤ 20 mensajes de ≤ 4000 chars
   con validación estricta de roles. Si se modifica la ruta, mantener estos
   límites — sin ellos un script puede quemar la cuota de Gemini.
2. **Cabeceras HTTP las pone Caddy**, no Next (`/root/var/www/dniskav/Caddyfile`):
   HSTS + nosniff + X-Frame-Options + Referrer-Policy en los 3 subdominios
   (snippet `(security)`), CSP solo en www. `Permissions-Policy camera=()`
   está bien aquí, pero NO en fair-drop (ver su AGENTS.md).
3. **`poweredByHeader: false`** en `next.config.ts` — no quitar.
4. **Dependencias**: `next` ≥ 16.3.5 (fix de prototype pollution en
   next-intl, postcss, sharp). Antes de hacer downgrade de Next, correr
   `npm audit` y justificar.
5. `.env*` en `.gitignore` — la API key nunca se ha subido al repo; mantenerlo así.

## Verificación tras cambios

```bash
curl -s -o /dev/null -w "%{http_code}" https://www.dniskav.com/en        # 200
curl -sI https://www.dniskav.com/en | grep -i content-security-policy   # presente
curl -s -X POST https://www.dniskav.com/api/chat \
  -H "Content-Type: application/json" -d '{"message":"ping"}'           # responde o 429
systemctl status dniskav | grep -E "dniskav|Main"                        # User=dniskav
```

## Servicios vecinos (no tocar sin motivo)

- **fAir-Drop** (pm2 `fairdrop`, puerto 3002) → `fair-drop.dniskav.com`
- **notes-mcp** (Docker, puerto host 3001) → `mcp-notes.dniskav.com`
- **Caddy** (Docker) — config en `/root/var/www/dniskav/Caddyfile`,
  recargar con `docker exec caddy caddy reload --config /etc/caddy/Caddyfile`.
  La config está **versionada en `infra/caddy/` de este repo** (sin secretos);
  tras cambiar el Caddyfile en el VPS, sincronizar la copia y commitear.

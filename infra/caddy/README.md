# Caddy (reverse proxy) — config versionada

Copia de la config real que vive en el VPS en `/root/var/www/dniskav/`.
El contenedor `caddy` corre ahí con docker-compose y hace de proxy de
los 3 servicios del VPS:

| Subdominio | Destino |
|---|---|
| `www.dniskav.com` | host 3000 (portfolio Next.js) |
| `mcp-notes.dniskav.com` | host 3001 (notes-mcp, Docker) |
| `fair-drop.dniskav.com` | host 3002 (fAir-Drop, pm2) |

## Archivos

- `Caddyfile` — dominios, proxies y cabeceras de seguridad
  - snippet `(security)`: HSTS, nosniff, X-Frame-Options DENY,
    Referrer-Policy (aplicado a los 3 sitios)
  - snippet `(header)`: CSP solo para www
  - **fair-drop usa `Permissions-Policy: camera=(self)`** — el escáner QR
    necesita la cámara. No cambiar a `camera=()` (rompe el QR scanner móvil)
- `Dockerfile` — Caddy 2 con plugin `caddy-dns/cloudflare` (DNS-01 challenge)
- `docker-compose.yml` — lee `CLOUDFLARE_API_TOKEN` desde `.env`
- `.env.example` — plantilla del `.env` (el `.env` real NO se versiona)

## Secretos

Ninguno commiteado: `CLOUDFLARE_API_TOKEN` vive en `/root/var/www/dniskav/.env`
en el VPS (chmod 600) y entra al contenedor como variable de entorno.

## Aplicar cambios

Editar `/root/var/www/dniskav/Caddyfile` en el VPS (o copiar desde aquí) y:

```bash
docker exec caddy caddy validate --config /etc/caddy/Caddyfile
docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```

Después, **copia los cambios de vuelta a este directorio y haz commit**
para que el repo refleje la realidad del VPS.

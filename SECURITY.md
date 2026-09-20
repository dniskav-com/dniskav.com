# Security Policy

## Scope

This covers the self-hosted site **dniskav.com** (portfolio, Next.js 16
self-hosted on Hetzner) and its public subdomains:

- `www.dniskav.com` — portfolio (Next.js)
- `fair-drop.dniskav.com` — fAir Drop file sharing app
- `mcp-notes.dniskav.com` — personal MCP notes server (API-key auth)

## Reporting a Vulnerability

Please report privately — do **not** open a public issue:

- **Email:** dniskav@gmail.com
- Or via [GitHub Security Advisories](https://github.com/dniskav/dniskav.com/security/advisories/new) (private)

Expect an initial response within a few days. Security fixes are deployed
automatically to production on push to `master`.

## What's in place (as of 2026-09-20)

- Dedicated system user + systemd sandboxing for the app service (no root)
- HSTS, CSP, `X-Frame-Options`, `X-Content-Type-Options` on all subdomains
- Server-side rate limiting and input limits on the AI chat endpoint
- Dependabot + CodeQL in CI; dependencies audited (`npm audit` clean)
- Firewall default-deny (UFW + Docker `DOCKER-USER` exception for published ports)
- Secrets kept out of the repo (`.env*` gitignored, keys in `/etc/*.env` chmod 600)

## Known non-issues

- The AI chat exposes only a public portfolio context; no personal data is
  retrievable through it. The system prompt lives in `src/lib/ai-context.ts`.

/**
 * src/lib/api.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for the backend base URL.
 *
 * Default : http://localhost:5001  (desktop development)
 * Override: set VITE_API_URL in .env.local              (phone / LAN access)
 *
 * .env.local example (never committed to git):
 *   VITE_API_URL=http://193.2.231.57:5001
 */
export const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:5001";

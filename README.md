# Envagai Frontend (React + Vite)

React web application scaffolded with Vite and wired to the backend API documented in [FRONTEND_API_DOCUMENTATION.md](FRONTEND_API_DOCUMENTATION.md).

## Features Included

- Auth flows: register, login, refresh-on-401, and current user fetch
- Protected API calls with bearer token handling
- Route-based app with guarded workflow page
- Document upload (`multipart/form-data` under `files`) and document listing
- Analysis trigger workflow (`/analysis/run`) with async behavior note
- Dashboard fetches: timeline, medications, lab trends, alerts
- Chat ask + session history retrieval
- Warning visibility for non-diagnostic medical output

## Project Structure

- [src/context/AuthContext.tsx](src/context/AuthContext.tsx): auth state, refresh token flow, protected request helper
- [src/pages/AuthPage.tsx](src/pages/AuthPage.tsx): API origin setup, register, login, and profile verification
- [src/pages/WorkflowPage.tsx](src/pages/WorkflowPage.tsx): end-to-end business flow for documents, analysis, dashboard, and chat
- [src/components/ProtectedRoute.tsx](src/components/ProtectedRoute.tsx): route guard for authenticated access
- [src/types/api.ts](src/types/api.ts): shared API contracts

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Configure backend origin:

```bash
copy .env.example .env
```

PowerShell alternative:

```powershell
Copy-Item .env.example .env
```

Set `VITE_API_ORIGIN` in `.env`, for example:

```env
VITE_API_ORIGIN=http://localhost:8000
```

3. Start development server:

```bash
npm run dev
```

4. Open the app and verify the API base preview in the "API Setup" card.

## Build

```bash
npm run build
```

## End-to-End Workflow

1. Open `/auth`, set backend origin, then register or login.
2. After login, continue to `/workflow`.
3. Upload one or more files using the documents card.
4. Trigger analysis with the uploaded or listed document IDs.
5. Refresh dashboard endpoints to load timeline, medications, trends, and alerts.
6. Ask chat questions and load chat history by session ID.
7. Surface warning messages in UI wherever returned.

The page includes a visible step tracker so operators can confirm each stage completed.

## Production Notes

- Session persistence uses `sessionStorage`; switch to stricter storage strategy if your security policy requires it.
- 401 handling retries once with `/auth/refresh`, then clears auth state on failure.
- Configure your deployment environment to inject `VITE_API_ORIGIN`.
- Consider adding observability, feature flags, and test coverage before go-live.

## SEO & Deployment (Railway)

- **Site origin:** set `VITE_SITE_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}` (or your custom domain) as a Railway service variable. If unset, the build falls back to `RAILWAY_PUBLIC_DOMAIN`; with neither, canonical/OG/JSON-LD/sitemap are omitted.
- **Pre-rendering:** [vite-plugin-seo.ts](vite-plugin-seo.ts) renders the public pages listed in [src/lib/publicPages.ts](src/lib/publicPages.ts) (`/`, `/auth`, `/about`, `/privacy`, `/terms`) to static HTML at build time with per-page title, description, canonical and Open Graph tags, and writes `robots.txt`, `sitemap.xml` and `spa.html` (the noindex app shell).
- **Serving:** Railpack uses the project's [Caddyfile](Caddyfile): pre-rendered pages are served extension-less, authenticated routes get the app shell with `X-Robots-Tag: noindex`, unknown URLs return a real **404**, and `/about/`, `/about.html`, `/index.html` 301 to their canonical URL.
- **Adding a route:** public → add it to `PUBLIC_PAGES` and `src/App.tsx` (import eagerly). Private → add it to `src/App.tsx`, `PRIVATE_PATH_PREFIXES` in the plugin, and the `@app` matcher in the Caddyfile.
- **Operator details:** set `SITE_OPERATOR.contactEmail` in `src/lib/publicPages.ts` once a support inbox exists; it appears on About/Privacy/Terms automatically.

## Notes

- By default, the API base path is `/api/v1` and is appended automatically.
- If your frontend and backend share the same host, you can leave backend origin empty.
- The app retries once after a 401 by calling `/auth/refresh` with the saved refresh token.

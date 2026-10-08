/* eslint-disable react/only-export-components -- build-time entry, never hot-reloaded */
import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import App from './App.tsx'

export { PUBLIC_PAGES } from './lib/publicPages'

/** Build-time only: renders a public route to HTML as a signed-out visitor sees it. Used by vite-plugin-seo.ts. */
export function render(url: string) {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </StaticRouter>
    </StrictMode>,
  )
}

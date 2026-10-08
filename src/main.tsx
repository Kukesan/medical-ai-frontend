import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { readStoredAuth } from './context/auth-storage'
import './index.css'
import App from './App.tsx'

const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)

// Public pages arrive pre-rendered for a signed-out visitor. Hydrate that markup, unless the visitor is
// signed in (e.g. "/" then redirects to the dashboard), in which case render fresh to avoid a hydration mismatch.
if (container.hasChildNodes() && !readStoredAuth().tokens) {
  hydrateRoot(container, app)
} else {
  container.replaceChildren()
  createRoot(container).render(app)
}

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { seo } from './vite-plugin-seo.ts'

/** Tokens and health data go to this origin, so a build must never point it at plain http (except localhost). */
function assertApiOrigin(origin: string | undefined) {
  const value = (origin ?? '').trim()
  if (!value) {
    throw new Error('VITE_API_ORIGIN is not set. Set it to the backend origin, e.g. https://api.example.com')
  }
  const { protocol, hostname } = new URL(value)
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1'
  if (protocol !== 'https:' && !isLocal) {
    throw new Error(`VITE_API_ORIGIN must use https (got "${value}")`)
  }
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    assertApiOrigin(loadEnv(mode, process.cwd(), '').VITE_API_ORIGIN)
  }

  return {
    plugins: [react(), tailwindcss(), seo()],
  }
})

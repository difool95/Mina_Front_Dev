import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig, type Connect, type Plugin } from 'vite'

/**
 * Serves `public/v.html` at `/v`, the shape the share links take.
 *
 * Vite exposes that file only at `/v.html`; every other path falls through to
 * the SPA, which is why `/v` reached react-router and 404'd. The rewrite has to
 * run before that fallback.
 *
 * It stays a standalone page rather than a route because its Open Graph tags
 * must be in the served markup — the scrapers behind link previews do not run
 * the app.
 */
function viewerRewrite(): Plugin {
  const rewrite: Connect.NextHandleFunction = (req, _res, next) => {
    const [path, query] = (req.url ?? '').split('?')

    if (path === '/v') req.url = `/v.html${query ? `?${query}` : ''}`

    next()
  }

  return {
    name: 'mina-viewer-rewrite',
    configureServer(server) {
      server.middlewares.use(rewrite)
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), viewerRewrite()],
  resolve: {
    alias: {
      // Keep in sync with `compilerOptions.paths` in tsconfig.app.json
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})

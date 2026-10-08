import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { createServer, loadEnv } from 'vite'
import type { HtmlTagDescriptor, Plugin, ResolvedConfig } from 'vite'

/** Mirrors PublicPage in src/lib/publicPages.ts (not imported, to keep browser types out of the Node build config). */
type PublicPage = {
  path: string
  title: string
  description: string
  canonicalPath?: string
  inSitemap: boolean
}

/**
 * Authenticated app routes. They hold private health data and have no search value.
 * Keep in sync with src/App.tsx and the @app matcher in Caddyfile.
 */
const PRIVATE_PATH_PREFIXES = [
  '/dashboard',
  '/timeline',
  '/document',
  '/analyze',
  '/chat',
  '/medical-records',
  '/record-intake',
  '/allergy',
  '/vaccination',
  '/surgery',
  '/profile',
]

/** Empty app shell served (with noindex) for private routes and unknown URLs. Referenced by Caddyfile. */
const SPA_SHELL = 'spa.html'

type PrerenderModule = {
  render: (url: string) => string
  PUBLIC_PAGES: PublicPage[]
}

function resolveSiteUrl(env: Record<string, string>) {
  const explicit = (env.VITE_SITE_URL ?? '').trim()
  // Railway exposes the service's public domain (no scheme) to builds.
  const railway = (env.RAILWAY_PUBLIC_DOMAIN ?? '').trim()
  const siteUrl = (explicit || (railway ? `https://${railway}` : '')).replace(/\/+$/, '')
  if (siteUrl && !/^https?:\/\/[^/]+$/.test(siteUrl)) {
    throw new Error(`VITE_SITE_URL must be an origin such as https://example.com (got "${siteUrl}")`)
  }
  return siteUrl
}

function buildRobots(siteUrl: string) {
  const lines = ['User-agent: *', 'Allow: /', ...PRIVATE_PATH_PREFIXES.map((prefix) => `Disallow: ${prefix}`)]
  if (siteUrl) {
    lines.push('', `Sitemap: ${siteUrl}/sitemap.xml`)
  }
  return `${lines.join('\n')}\n`
}

function buildSitemap(siteUrl: string, pages: PublicPage[]) {
  const urls = pages
    .filter((page) => page.inSitemap)
    .map((page) => `  <url>\n    <loc>${siteUrl}${page.path}</loc>\n  </url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

/** Site-wide entities; page-level schema (WebApplication, FAQPage, BreadcrumbList…) is rendered by the pages. */
function buildSiteStructuredData(siteUrl: string) {
  const organizationId = `${siteUrl}/#organization`
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: 'Envagai',
        url: `${siteUrl}/`,
        logo: `${siteUrl}/logo-512.png`,
        parentOrganization: { '@type': 'Organization', name: 'Zyntex Solutions' },
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        name: 'Envagai',
        url: `${siteUrl}/`,
        inLanguage: 'en',
        publisher: { '@id': organizationId },
      },
    ],
  }
}

const escapeAttr = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Replaces the content of an existing <meta {attr}="{key}" content="..."> tag in index.html. */
function setMeta(html: string, attr: 'name' | 'property', key: string, content: string) {
  const pattern = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`)
  if (!pattern.test(html)) {
    throw new Error(`[envagai-seo] index.html is missing <meta ${attr}="${key}">`)
  }
  return html.replace(pattern, `$1${escapeAttr(content)}$2`)
}

function renderPageHtml(template: string, page: PublicPage, appHtml: string, siteUrl: string) {
  let html = template.replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(page.title)}</title>`)
  html = setMeta(html, 'name', 'description', page.description)
  html = setMeta(html, 'property', 'og:title', page.title)
  html = setMeta(html, 'property', 'og:description', page.description)
  html = setMeta(html, 'name', 'twitter:title', page.title)
  html = setMeta(html, 'name', 'twitter:description', page.description)
  if (siteUrl) {
    const canonical = `${siteUrl}${page.canonicalPath ?? page.path}`
    html = html.replace(
      '</head>',
      `  <link rel="canonical" href="${canonical}" />\n    <meta property="og:url" content="${canonical}" />\n  </head>`,
    )
  }
  return html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
}

/** "/" -> index.html, "/about" -> about.html (served extension-less by Caddy's try_files). */
const outputFileFor = (pagePath: string) => (pagePath === '/' ? 'index.html' : `${pagePath.slice(1)}.html`)

async function prerender(config: ResolvedConfig, siteUrl: string) {
  const outDir = path.resolve(config.root, config.build.outDir)
  const template = await readFile(path.join(outDir, 'index.html'), 'utf8')

  const server = await createServer({
    root: config.root,
    configFile: false,
    logLevel: 'error',
    mode: config.mode,
    plugins: [react()],
    define: { 'import.meta.env.VITE_SITE_URL': JSON.stringify(siteUrl) },
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
  })

  try {
    const { render, PUBLIC_PAGES } = (await server.ssrLoadModule('/src/entry-prerender.tsx')) as PrerenderModule

    for (const page of PUBLIC_PAGES) {
      const file = path.join(outDir, outputFileFor(page.path))
      await mkdir(path.dirname(file), { recursive: true })
      await writeFile(file, renderPageHtml(template, page, render(page.path), siteUrl))
    }

    // The shell keeps the default head but must never be indexed: it is what private and unknown URLs receive.
    const shell = template.replace('</head>', '  <meta name="robots" content="noindex" />\n  </head>')
    await writeFile(path.join(outDir, SPA_SHELL), shell)

    if (siteUrl) {
      await writeFile(path.join(outDir, 'sitemap.xml'), buildSitemap(siteUrl, PUBLIC_PAGES))
    }
    config.logger.info(`[envagai-seo] pre-rendered ${PUBLIC_PAGES.map((page) => page.path).join(', ')}`)
  } finally {
    await server.close()
  }
}

/**
 * SEO build step:
 * - resolves the site origin (VITE_SITE_URL, else Railway's RAILWAY_PUBLIC_DOMAIN) and exposes it as import.meta.env.VITE_SITE_URL
 * - pre-renders public routes to static HTML with per-page title, description, canonical and Open Graph tags
 * - writes robots.txt, sitemap.xml and the noindex SPA shell
 * Without a site origin, absolute-URL tags and the sitemap are omitted rather than pointing at a wrong domain.
 */
export function seo(): Plugin {
  let siteUrl = ''
  let resolvedConfig: ResolvedConfig

  return {
    name: 'envagai-seo',

    config(userConfig, { mode }) {
      siteUrl = resolveSiteUrl(loadEnv(mode, userConfig.envDir || process.cwd(), ''))
      return { define: { 'import.meta.env.VITE_SITE_URL': JSON.stringify(siteUrl) } }
    },

    configResolved(config) {
      resolvedConfig = config
      if (!siteUrl && config.command === 'build') {
        config.logger.warn(
          '\n[envagai-seo] No VITE_SITE_URL or RAILWAY_PUBLIC_DOMAIN: canonical, og:url, og:image, JSON-LD and sitemap.xml will be omitted.\n',
        )
      }
    },

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/robots.txt') {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end(buildRobots(siteUrl))
        } else if (req.url === '/sitemap.xml' && siteUrl) {
          const { PUBLIC_PAGES } = (await server.ssrLoadModule('/src/lib/publicPages.ts')) as PrerenderModule
          res.setHeader('Content-Type', 'application/xml; charset=utf-8')
          res.end(buildSitemap(siteUrl, PUBLIC_PAGES))
        } else {
          next()
        }
      })
    },

    transformIndexHtml(): HtmlTagDescriptor[] {
      if (!siteUrl) {
        return []
      }
      const ogImage = `${siteUrl}/og-image.png`
      const meta = (attrs: Record<string, string>): HtmlTagDescriptor => ({ tag: 'meta', attrs, injectTo: 'head' })
      return [
        meta({ property: 'og:image', content: ogImage }),
        meta({ property: 'og:image:width', content: '1200' }),
        meta({ property: 'og:image:height', content: '630' }),
        meta({ property: 'og:image:alt', content: 'Envagai: your medical history, organized and understood' }),
        meta({ name: 'twitter:image', content: ogImage }),
        {
          tag: 'script',
          attrs: { type: 'application/ld+json' },
          children: JSON.stringify(buildSiteStructuredData(siteUrl)),
          injectTo: 'head',
        },
      ]
    },

    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: buildRobots(siteUrl) })
    },

    async closeBundle() {
      if (resolvedConfig.command === 'build' && !resolvedConfig.build.ssr) {
        await prerender(resolvedConfig, siteUrl)
      }
    },
  }
}

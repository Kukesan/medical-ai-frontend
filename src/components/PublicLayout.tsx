import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Brand } from './EnvagaiLogo'
import { JsonLd } from './JsonLd'
import { absoluteUrl, SITE_OPERATOR } from '../lib/publicPages'
import { usePublicPageMeta } from '../lib/seo'

const footerLinks = [
  { to: '/about', label: 'About' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Use' },
]

/** Site header for public pages; `children` are the right-hand navigation items. */
export function PublicHeader({ children }: { children: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-primary-900/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" aria-label="Envagai home" className="rounded-lg">
          <Brand inverted />
        </Link>
        <nav className="flex items-center gap-2" aria-label="Main">
          {children}
        </nav>
      </div>
    </header>
  )
}

export function PublicFooter() {
  return (
    <footer className="bg-primary-900">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-4 py-8 text-center sm:flex-row sm:px-6 sm:text-left">
        <Link to="/" aria-label="Envagai home" className="rounded-lg">
          <Brand inverted />
        </Link>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            {footerLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-sm text-white/70 transition-colors hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="max-w-xs text-xs text-white/50">
          © {new Date().getFullYear()} {SITE_OPERATOR.name}. Envagai is not a substitute for professional medical advice.
        </p>
      </div>
    </footer>
  )
}

const headerLinkClass =
  'rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white'

type InfoPageProps = {
  path: string
  heading: string
  /** ISO date the content was last reviewed, shown on legal pages. */
  updated?: string
  schemaType?: 'AboutPage' | 'WebPage'
  children: ReactNode
}

/** Layout for text pages (About, Privacy, Terms): header, breadcrumbs, readable article column, footer. */
export function InfoPage({ path, heading, updated, schemaType = 'WebPage', children }: InfoPageProps) {
  usePublicPageMeta(path)

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <PublicHeader>
        <Link to="/#features" className={`hidden sm:inline-block ${headerLinkClass}`}>
          Features
        </Link>
        <Link
          to="/auth"
          className="h-9 rounded-lg bg-accent-400 px-4 text-sm font-semibold leading-9 text-primary-900 transition-colors hover:bg-accent-300"
        >
          Sign In
        </Link>
      </PublicHeader>

      <main className="flex-1 py-10 sm:py-14">
        <article className="mx-auto max-w-3xl px-4 sm:px-6">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-1.5 text-sm text-gray-500">
              <li>
                <Link to="/" className="hover:text-gray-900">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li aria-current="page" className="font-medium text-gray-900">
                {heading}
              </li>
            </ol>
          </nav>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{heading}</h1>
          {updated ? (
            <p className="mt-2 text-sm text-gray-500">
              Last updated <time dateTime={updated}>{new Date(`${updated}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}</time>
            </p>
          ) : null}

          <div className="mt-8 space-y-4 text-base leading-relaxed text-gray-700 [&_a]:font-medium [&_a]:text-primary-700 [&_a]:underline [&_h2]:pt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_li]:ml-5 [&_ul]:list-disc [&_ul]:space-y-2">
            {children}
          </div>
        </article>
      </main>

      <PublicFooter />

      <JsonLd
        data={{
          '@graph': [
            {
              '@type': schemaType,
              '@id': `${absoluteUrl(path)}#webpage`,
              url: absoluteUrl(path),
              name: heading,
              isPartOf: { '@id': `${absoluteUrl('/')}#website` },
              ...(updated ? { dateModified: updated } : {}),
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
                { '@type': 'ListItem', position: 2, name: heading, item: absoluteUrl(path) },
              ],
            },
          ],
        }}
      />
    </div>
  )
}

/** Contact sentence that only names an email address once a real one is configured. */
export function ContactLine() {
  return SITE_OPERATOR.contactEmail ? (
    <>
      email <a href={`mailto:${SITE_OPERATOR.contactEmail}`}>{SITE_OPERATOR.contactEmail}</a>
    </>
  ) : (
    <>contact {SITE_OPERATOR.name}</>
  )
}

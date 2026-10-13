import { useEffect, useState } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Menu, X } from 'lucide-react'
import { Brand } from './EnvagaiLogo'
import { JsonLd } from './JsonLd'
import { buttonClassName } from './ui'
import { absoluteUrl, LANDING_SECTIONS, SITE_OPERATOR, type NavItem } from '../lib/publicPages'
import { usePublicPageMeta } from '../lib/seo'

const companyLinks: NavItem[] = [
  { href: '/about', label: 'About' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Use' },
]

/** In-page anchors ("#faq") stay plain links; everything else goes through the router. */
function NavAnchor({ item, className }: { item: NavItem; className?: string }) {
  return item.href.startsWith('#') ? (
    <a href={item.href} className={className}>
      {item.label}
    </a>
  ) : (
    <Link to={item.href} className={className}>
      {item.label}
    </Link>
  )
}

type PublicHeaderProps = {
  links: NavItem[]
  /** Calls to action on the right of the bar. Hide secondary ones below `sm` and repeat them in `mobileActions`. */
  actions: ReactNode
  /** Extra actions shown at the bottom of the mobile menu. */
  mobileActions?: ReactNode
}

/** Sticky site header for public pages, with a disclosure menu below the `md` breakpoint. */
export function PublicHeader({ links, actions, mobileActions }: PublicHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) {
      return
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  // Any link or button inside the mobile menu navigates somewhere, so close the menu behind it.
  const closeOnNavigate = (event: MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('a, button')) {
      setMenuOpen(false)
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" aria-label="Envagai home" className="rounded-lg">
          <Brand />
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {links.map((item) => (
              <li key={item.href}>
                <NavAnchor
                  item={item}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                />
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {actions}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100 md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        hidden={!menuOpen}
        onClick={closeOnNavigate}
        className="border-t border-gray-200/80 bg-white px-4 pb-5 pt-2 shadow-pop md:hidden"
      >
        <nav aria-label="Mobile">
          <ul>
            {links.map((item) => (
              <li key={item.href}>
                <NavAnchor
                  item={item}
                  className="block rounded-lg px-3 py-3 text-base font-medium text-gray-800 hover:bg-gray-50"
                />
              </li>
            ))}
          </ul>
        </nav>
        {mobileActions ? <div className="mt-3 grid gap-2 border-t border-gray-100 pt-4">{mobileActions}</div> : null}
      </div>
    </header>
  )
}

export function PublicFooter() {
  return (
    <footer className="bg-primary-900 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.6fr_1fr_1fr]">
        <div className="max-w-sm">
          <Link to="/" aria-label="Envagai home" className="inline-block rounded-lg">
            <Brand inverted />
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            A private place to keep your medical documents, understand them with AI, and arrive at appointments
            prepared.
          </p>
        </div>

        <nav aria-labelledby="footer-product">
          <h2 id="footer-product" className="text-xs font-semibold uppercase tracking-wider text-white/50">
            Product
          </h2>
          <ul className="mt-4 space-y-3">
            {LANDING_SECTIONS.map((item) => (
              <li key={item.href}>
                <NavAnchor item={item} className="text-sm text-white/80 transition-colors hover:text-white" />
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-company">
          <h2 id="footer-company" className="text-xs font-semibold uppercase tracking-wider text-white/50">
            Company
          </h2>
          <ul className="mt-4 space-y-3">
            {companyLinks.map((item) => (
              <li key={item.href}>
                <NavAnchor item={item} className="text-sm text-white/80 transition-colors hover:text-white" />
              </li>
            ))}
            {SITE_OPERATOR.contactEmail ? (
              <li>
                <a
                  href={`mailto:${SITE_OPERATOR.contactEmail}`}
                  className="text-sm text-white/80 transition-colors hover:text-white"
                >
                  Contact
                </a>
              </li>
            ) : null}
          </ul>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs leading-relaxed text-white/55 sm:px-6 md:flex-row md:items-start md:justify-between md:gap-10">
          <p className="max-w-2xl">
            Envagai provides information, not medical advice, diagnosis or treatment. Always consult a qualified
            healthcare professional. In an emergency, contact your local emergency services immediately.
          </p>
          <p className="shrink-0">
            © {new Date().getFullYear()} {SITE_OPERATOR.name}
          </p>
        </div>
      </div>
    </footer>
  )
}

/** Header calls to action shared by the text pages; the landing page wires its own to the sign-in card. */
function InfoPageHeader() {
  return (
    <PublicHeader
      links={LANDING_SECTIONS}
      actions={
        <>
          <Link to="/auth" className={buttonClassName('ghost', 'md', 'hidden sm:inline-flex')}>
            Sign in
          </Link>
          <Link to="/#get-started" className={buttonClassName('primary', 'md')}>
            Get started
          </Link>
        </>
      }
      mobileActions={
        <Link to="/auth" className={buttonClassName('secondary', 'lg', 'w-full sm:hidden')}>
          Sign in
        </Link>
      }
    />
  )
}

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
      <InfoPageHeader />

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

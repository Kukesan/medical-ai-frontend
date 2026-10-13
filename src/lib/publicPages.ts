/**
 * Single source of truth for public (pre-rendered, crawlable) routes.
 * Used by the React pages for client-side head updates and by vite-plugin-seo.ts
 * for pre-rendering, per-page head tags and sitemap.xml.
 */
export type PublicPage = {
  path: string
  /** Full document title. */
  title: string
  description: string
  /** Preferred URL when this route duplicates another one. Defaults to `path`. */
  canonicalPath?: string
  /** Only canonical, indexable pages go into sitemap.xml. */
  inSitemap: boolean
}

export const SITE_NAME = 'Envagai'

/** Production origin, resolved at build time by vite-plugin-seo.ts (VITE_SITE_URL, else Railway's public domain). May be empty. */
export const SITE_URL: string = import.meta.env.VITE_SITE_URL ?? ''

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path}`
}

/** Operator details shown on About/Privacy/Terms. Leave contactEmail empty until a real inbox exists; it is hidden when empty. */
export const SITE_OPERATOR = {
  name: 'Zyntex Solutions',
  contactEmail: 'info@zyntexsolutions.com',
}

const HOME_DESCRIPTION =
  'Upload prescriptions and lab reports. Envagai extracts key details, checks medication interactions, answers your questions and keeps your health timeline private.'

export const PUBLIC_PAGES: PublicPage[] = [
  {
    path: '/',
    title: 'Envagai: Understand Your Medical Reports and Records with AI',
    description: HOME_DESCRIPTION,
    inSitemap: true,
  },
  {
    path: '/auth',
    title: 'Sign In · Envagai',
    description: HOME_DESCRIPTION,
    canonicalPath: '/',
    inSitemap: false,
  },
  {
    path: '/about',
    title: 'About Envagai · Personal Medical Records Organizer',
    description:
      'Envagai is a personal health records app by Zyntex Solutions that organizes your medical documents, timeline and medications. Learn what it does and its limits.',
    inSitemap: true,
  },
  {
    path: '/privacy',
    title: 'Privacy Policy · Envagai',
    description:
      'How Envagai collects, stores and processes your health documents and records, which service providers are involved, and how you can delete your data.',
    inSitemap: true,
  },
  {
    path: '/terms',
    title: 'Terms of Use · Envagai',
    description:
      'The terms for using Envagai, including that it provides information only and is not a substitute for professional medical advice, diagnosis or treatment.',
    inSitemap: true,
  },
]

export type NavItem = { href: string; label: string }

/** Landing page sections, linked from the header and footer of every public page. */
export const LANDING_SECTIONS: NavItem[] = [
  { href: '/#features', label: 'Features' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#safety', label: 'Safety & privacy' },
  { href: '/#faq', label: 'FAQ' },
]

export function getPublicPage(path: string) {
  return PUBLIC_PAGES.find((page) => page.path === path)
}

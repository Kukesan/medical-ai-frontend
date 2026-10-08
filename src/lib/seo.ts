import { useEffect } from 'react'
import { getPublicPage, SITE_NAME } from './publicPages'

type PageMeta = {
  /** Page-specific title; rendered as "<title> · Envagai". */
  title?: string
  /** Private and error pages must not be indexed. */
  noindex?: boolean
}

/**
 * Applies per-route head metadata for private and error pages.
 * Previous values are restored on unmount so the next route starts from where it was.
 */
export function usePageMeta({ title, noindex = false }: PageMeta) {
  useEffect(() => {
    const previousTitle = document.title
    if (title) {
      document.title = `${title} · ${SITE_NAME}`
    }

    let robots: HTMLMetaElement | null = null
    let previousRobots: string | null = null
    let canonical: HTMLLinkElement | null = null

    if (noindex) {
      // The SPA shell served for private/unknown URLs already carries a robots tag; reuse it rather than duplicating.
      robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')
      if (robots) {
        previousRobots = robots.content
      } else {
        robots = document.createElement('meta')
        robots.name = 'robots'
        document.head.appendChild(robots)
      }
      robots.content = 'noindex, nofollow'

      // A canonical pointing at another page would contradict noindex, so detach it while this page is shown.
      canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
      canonical?.remove()
    }

    return () => {
      document.title = previousTitle
      if (robots && previousRobots !== null) {
        robots.content = previousRobots
      } else {
        robots?.remove()
      }
      if (canonical) {
        document.head.appendChild(canonical)
      }
    }
  }, [title, noindex])
}

/**
 * Keeps title, description and canonical in sync when navigating between public pages client-side.
 * The first load already has the right tags, written by the build-time pre-render.
 */
export function usePublicPageMeta(path: string) {
  useEffect(() => {
    const page = getPublicPage(path)
    if (!page) {
      return
    }
    document.title = page.title
    document.head.querySelector('meta[name="description"]')?.setAttribute('content', page.description)
    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (canonical) {
      canonical.href = new URL(page.canonicalPath ?? page.path, canonical.href).href
    }
  }, [path])
}

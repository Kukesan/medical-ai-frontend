import { SITE_URL } from '../lib/publicPages'

/** Renders schema.org JSON-LD. Skipped when no site URL is configured, since schema URLs must be absolute. */
export function JsonLd({ data }: { data: object }) {
  if (!SITE_URL) {
    return null
  }
  // Escape "<" so page content can never close the script tag early.
  const json = JSON.stringify({ '@context': 'https://schema.org', ...data }).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}

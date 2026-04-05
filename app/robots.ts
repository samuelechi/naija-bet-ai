import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/profile', '/history'],
    },
    sitemap: 'https://naijabetai.com/sitemap.xml',
  }
}
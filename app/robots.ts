import { MetadataRoute } from 'next'

export default function robots(): 
  MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/login',
        '/egg-farm',
        '/broiler-farm',
        '/egg-kiosk',
        '/butcher',
        '/finance',
        '/admin',
      ],
    },
    sitemap: 'https://30plus.rw/sitemap.xml',
  }
}

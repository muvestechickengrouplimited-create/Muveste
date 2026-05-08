import { MetadataRoute } from 'next'

export default function robots(): 
  MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/login',
        '/admin',
        '/finance',
        '/broiler-farm',
        '/butcher-kibungo',
        '/butcher-rwamagana',
        '/butcher-nyabugogo',
        '/settings',
        '/api/',
      ],
    },
    sitemap: 'https://muveste.rw/sitemap.xml',
  }
}

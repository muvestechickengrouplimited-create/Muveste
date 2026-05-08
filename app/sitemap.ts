import { MetadataRoute } from 'next'

export default function sitemap(): 
  MetadataRoute.Sitemap {
  return [
    {
      url: 'https://muveste.rw',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://muveste.rw/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://muveste.rw/contact',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]
}

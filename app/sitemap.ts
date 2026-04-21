import { MetadataRoute } from 'next'

export default function sitemap(): 
  MetadataRoute.Sitemap {
  return [
    {
      url: 'https://30plus.rw',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://30plus.rw/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}

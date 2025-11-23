import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://seoulfounders.club";

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/about',
          '/events',
          '/member',
          '/communities',
          '/community/board/free',
          '/community/board/vangol',
          '/community/board/hightalk',
        ],
        disallow: [
          '/auth/',
          '/admin/',
          '/api/',
          '/community/profile',
          '/community/board/announcements',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/about',
          '/events',
          '/member',
          '/communities',
          '/community/board/free',
          '/community/board/vangol',
          '/community/board/hightalk',
        ],
        disallow: [
          '/auth/',
          '/admin/',
          '/api/',
          '/community/profile',
          '/community/board/announcements',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}


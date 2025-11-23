import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const PUBLIC_BOARDS = ["free", "vangol", "hightalk"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://seoulfounders.club";
  const supabase = await createClient();

  // 기본 페이지들
  const routes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/events`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/member`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/communities`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // 전체 공개 게시판 페이지들
  for (const slug of PUBLIC_BOARDS) {
    routes.push({
      url: `${siteUrl}/community/board/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    });
  }

  // 전체 공개 게시판의 게시글들
  try {
    for (const slug of PUBLIC_BOARDS) {
      const categorySlug = slug === "announcements" ? "announcement" : slug;
      const { data: posts } = await supabase
        .from("posts")
        .select("id, updated_at, created_at")
        .eq("category", categorySlug)
        .order("created_at", { ascending: false })
        .limit(100); // 최근 100개만 포함

      if (posts) {
        posts.forEach((post) => {
          routes.push({
            url: `${siteUrl}/community/board/${slug}/${post.id}`,
            lastModified: new Date(post.updated_at || post.created_at),
            changeFrequency: 'weekly',
            priority: 0.6,
          });
        });
      }
    }
  } catch (error) {
    console.error('Error fetching posts for sitemap:', error);
  }

  // 이벤트 페이지들
  try {
    const { data: events } = await supabase
      .from("events")
      .select("id, updated_at, created_at")
      .gte("event_date", new Date().toISOString())
      .order("event_date", { ascending: true })
      .limit(50);

    if (events) {
      events.forEach((event) => {
        routes.push({
          url: `${siteUrl}/events/${event.id}`,
          lastModified: new Date(event.updated_at || event.created_at),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      });
    }
  } catch (error) {
    console.error('Error fetching events for sitemap:', error);
  }

  // 소모임 페이지들
  try {
    const { data: communities } = await supabase
      .from("communities")
      .select("id, updated_at, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (communities) {
      communities.forEach((community) => {
        routes.push({
          url: `${siteUrl}/communities/${community.id}`,
          lastModified: new Date(community.updated_at || community.created_at),
          changeFrequency: 'weekly',
          priority: 0.6,
        });
      });
    }
  } catch (error) {
    console.error('Error fetching communities for sitemap:', error);
  }

  return routes;
}


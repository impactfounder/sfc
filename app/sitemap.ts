import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const PUBLIC_BOARDS = ["free", "vangol", "hightalk", "insights"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://seoulfounders.club";

  // Sitemap 생성을 위한 직접 클라이언트 생성 (쿠키 의존성 제거)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase environment variables are missing for sitemap generation");
    // 환경 변수가 없어도 기본 페이지들은 반환하도록 함
    return [
      {
        url: siteUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      // ... 다른 정적 페이지들은 아래 로직에서 추가됨
    ];
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

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
      // URL slug를 DB slug로 변환
      let dbSlug = slug;
      if (slug === 'free') dbSlug = 'free-board';
      if (slug === 'announcements') dbSlug = 'announcement';

      const { data: posts } = await supabase
        .from("posts")
        .select(`
          id, 
          updated_at, 
          created_at,
          board_categories!inner(slug)
        `)
        .eq("board_categories.slug", dbSlug)
        .order("created_at", { ascending: false })
        .limit(100); // 최근 100개만 포함

      if (posts) {
        posts.forEach((post: any) => {
          // 인사이트 게시글은 priority를 0.8로 설정
          const priority = slug === "insights" ? 0.8 : 0.6;

          routes.push({
            url: `${siteUrl}/community/board/${slug}/${post.id}`,
            lastModified: new Date(post.updated_at || post.created_at),
            changeFrequency: 'weekly',
            priority: priority,
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


import { SupabaseClient } from "@supabase/supabase-js"

type FeedItem =
  | ({ kind: "post" } & {
      id: string
      title: string
      created_at: string
      likes_count: number
      comments_count: number
      thumbnail_url?: string | null
      board_categories?: { name: string | null; slug: string | null } | null
      related_event_id?: string | null
      is_announcement?: boolean | null
      is_event?: boolean | null
      profiles?: { id: string; full_name: string | null; avatar_url: string | null } | null
    })
  | ({ kind: "event" } & {
      id: string
      title: string
      event_date: string
      location?: string | null
      thumbnail_url?: string | null
      current_participants?: number | null
      max_participants?: number | null
      event_type?: string | null
    })

export async function getCommunityFeed(
  supabase: SupabaseClient,
  filter: "latest" | "popular" = "latest",
  limit = 30
): Promise<FeedItem[]> {
  // 1) 게시글 가져오기
  let postQuery = supabase
    .from("posts")
    .select(`
      id, title, content, created_at, likes_count, comments_count, thumbnail_url, related_event_id,
      is_announcement, is_event,
      profiles:author_id (id, full_name, avatar_url),
      board_categories(name, slug)
    `)

  if (filter === "popular") {
    postQuery = postQuery.order("likes_count", { ascending: false }).order("created_at", { ascending: false })
  } else {
    postQuery = postQuery.order("created_at", { ascending: false })
  }

  postQuery = postQuery.limit(limit)

  // 2) 이벤트 가져오기 (간단 정렬)
  let eventQuery = supabase
    .from("events")
    .select(`
      id, title, thumbnail_url, event_date, location, max_participants,
      event_registrations (count),
      event_type
    `)
    .order("event_date", { ascending: true })
    .limit(Math.ceil(limit / 2))

  const [postsResult, eventsResult] = await Promise.all([postQuery, eventQuery])

  const posts = (postsResult.data || []).map((p: any) => ({
    kind: "post" as const,
    ...p,
    content_preview: p.content ? String(p.content).replace(/<[^>]*>/g, "").slice(0, 160) : null,
    likes_count: p.likes_count || 0,
    comments_count: p.comments_count || 0,
    board_categories: Array.isArray(p.board_categories) ? p.board_categories[0] : p.board_categories,
    profiles: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles,
  }))

  const events = (eventsResult.data || []).map((e: any) => ({
    kind: "event" as const,
    id: e.id,
    title: e.title,
    event_date: e.event_date,
    location: e.location,
    thumbnail_url: e.thumbnail_url,
    max_participants: e.max_participants,
    current_participants: e.event_registrations?.[0]?.count || 0,
    event_type: e.event_type || null,
  }))

  if (filter === "popular") {
    posts.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
  }

  // 3) 게시글 + 이벤트 통합 (간단 머지: 최신순으로 섞되 이벤트는 사이에 삽입)
  const merged: FeedItem[] = []
  const maxLen = Math.max(posts.length, events.length)
  for (let i = 0; i < maxLen; i++) {
    if (posts[i]) merged.push(posts[i])
    if (events[i] && filter === "latest") merged.push(events[i]) // 최신 탭에서는 자연스럽게 끼워 넣기
  }

  // 인기 탭에서는 게시글 우선, 이벤트는 뒤에 추가
  if (filter === "popular") {
    merged.push(...events)
  }

  return merged.slice(0, limit)
}


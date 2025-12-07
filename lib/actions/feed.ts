"use server"

import { createClient } from "@/lib/supabase/server"
import type { PostForDisplay } from "@/lib/types/posts"

type SortOption = "latest" | "popular"

export async function fetchFeedPosts(page: number = 1, sort: SortOption = "latest"): Promise<PostForDisplay[]> {
  const supabase = await createClient()
  const PAGE_SIZE = 10
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from("posts")
    .select(
      `
        id,
        title,
        content,
        created_at,
        likes_count,
        comments_count,
        thumbnail_url,
        board_categories!inner(name, slug),
        profiles:author_id(id, full_name, avatar_url),
        communities(name)
      `
    )
    .neq("board_categories.slug", "announcement")
    .range(from, to)

  if (sort === "popular") {
    query = query.order("likes_count", { ascending: false }).order("created_at", { ascending: false })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  const { data, error } = await query

  if (error || !data) {
    console.error("fetchFeedPosts error:", error)
    return []
  }

  return data.map((post: any) => {
    const boardCategory = Array.isArray(post.board_categories) ? post.board_categories[0] : post.board_categories
    const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      created_at: post.created_at,
      likes_count: post.likes_count,
      comments_count: post.comments_count,
      thumbnail_url: post.thumbnail_url,
      board_categories: boardCategory
        ? {
            name: boardCategory.name,
            slug: boardCategory.slug,
          }
        : null,
      profiles: profile
        ? {
            id: profile.id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
          }
        : null,
      communities: post.communities
        ? {
            name: Array.isArray(post.communities) ? post.communities[0]?.name : post.communities.name,
          }
        : null,
    } satisfies PostForDisplay
  })
}


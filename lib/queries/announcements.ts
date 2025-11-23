import { SupabaseClient } from "@supabase/supabase-js"

/**
 * 최신 공지사항 1개 가져오기
 */
export async function getLatestAnnouncement(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("posts")
    .select(`
      id,
      title,
      board_categories!inner (slug)
    `)
    .eq("board_categories.slug", "announcement")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("Error fetching announcement:", error)
    return null
  }

  return data
}


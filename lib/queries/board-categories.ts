import { SupabaseClient } from "@supabase/supabase-js"

export type BoardCategory = {
  id: string
  name: string
  slug: string
}

/**
 * 활성화된 게시판 카테고리 목록 가져오기
 */
export async function getBoardCategories(
  supabase: SupabaseClient
): Promise<BoardCategory[]> {
  const { data, error } = await supabase
    .from("board_categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("order_index", { ascending: true })

  if (error) {
    console.error("Error fetching board categories:", error)
    return []
  }

  return (data || []) as BoardCategory[]
}


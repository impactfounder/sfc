import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

const FREE_BOARD_SLUG = "free-board"

export async function POST(request: NextRequest) {
  try {
    const { title, content } = await request.json()

    if (!title || !content) {
      return NextResponse.json({ error: "제목과 내용을 모두 입력해주세요." }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
    }

    const { data: category } = await supabase
      .from("board_categories")
      .select("id")
      .eq("slug", FREE_BOARD_SLUG)
      .eq("is_active", true)
      .single()

    if (!category) {
      return NextResponse.json({ error: "자유게시판 정보를 찾을 수 없습니다." }, { status: 404 })
    }

    const { data, error } = await supabase
      .from("posts")
      .insert({
        title: title.trim(),
        content: content.trim(),
        author_id: user.id,
        board_category_id: category.id,
        category: FREE_BOARD_SLUG,
      })
      .select("id")
      .single()

    if (error) {
      throw error
    }

    revalidatePath("/community/free")

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (error) {
    console.error("Failed to create free board post:", error)
    return NextResponse.json({ error: "게시글 등록에 실패했습니다." }, { status: 500 })
  }
}







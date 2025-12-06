"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type {
    Review,
    ReviewInsertData,
    ReviewUpdateData,
    ReviewForDisplay,
} from "@/lib/types/reviews"

/**
 * 새 후기 생성
 */
export async function createReview(data: ReviewInsertData) {
    const supabase = await createClient()

    const { data: review, error } = await supabase
        .from("reviews")
        .insert(data)
        .select()
        .single()

    if (error) {
        console.error("후기 생성 실패 상세:", JSON.stringify(error, null, 2))
        throw new Error(`후기 작성 실패: ${error.message} (Code: ${error.code})`)
    }

    revalidatePath("/reviews")
    return review as Review
}

/**
 * 후기 수정
 */
export async function updateReview(id: string, data: ReviewUpdateData) {
    const supabase = await createClient()

    const { data: review, error } = await supabase
        .from("reviews")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

    if (error) {
        console.error("후기 수정 실패:", error)
        throw new Error("후기를 수정하는데 실패했습니다.")
    }

    revalidatePath("/reviews")
    return review as Review
}

/**
 * 후기 삭제
 */
export async function deleteReview(id: string) {
    const supabase = await createClient()

    const { error } = await supabase.from("reviews").delete().eq("id", id)

    if (error) {
        console.error("후기 삭제 실패:", error)
        throw new Error("후기를 삭제하는데 실패했습니다.")
    }

    revalidatePath("/reviews")
}

/**
 * 이벤트별 후기 조회
 */
export async function getReviewsByEvent(eventId: string) {
    const supabase = await createClient()

    const { data: reviews, error } = await supabase
        .from("reviews")
        .select(
            `
      *,
      profiles(
        id,
        full_name,
        avatar_url,
        role,
        company,
        position
      ),
      events(
        id,
        title,
        event_date,
        thumbnail_url
      )
    `
        )
        .eq("event_id", eventId)
        .eq("is_public", true)
        .order("created_at", { ascending: false })

    if (error) {
        console.error("후기 조회 실패:", error)
        throw new Error("후기를 불러오는데 실패했습니다.")
    }

    return reviews as ReviewForDisplay[]
}

/**
 * 사용자별 후기 조회
 */
export async function getUserReviews(userId: string) {
    const supabase = await createClient()

    const { data: reviews, error } = await supabase
        .from("reviews")
        .select(
            `
      *,
      profiles(
        id,
        full_name,
        avatar_url,
        role,
        company,
        position
      ),
      events(
        id,
        title,
        event_date,
        thumbnail_url
      )
    `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

    if (error) {
        console.error("후기 조회 실패:", error)
        throw new Error("후기를 불러오는데 실패했습니다.")
    }

    return reviews as ReviewForDisplay[]
}

/**
 * 모든 공개 후기 조회
 */
export async function getAllPublicReviews(limit = 20) {
    const supabase = await createClient()

    const { data: reviews, error } = await supabase
        .from("reviews")
        .select(
            `
      *,
      profiles(
        id,
        full_name,
        avatar_url,
        role,
        company,
        position
      ),
      events(
        id,
        title,
        event_date,
        thumbnail_url
      )
    `
        )
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(limit)

    if (error) {
        console.error("후기 조회 실패:", error)
        throw new Error("후기를 불러오는데 실패했습니다.")
    }

    return reviews as ReviewForDisplay[]
}

/**
 * 베스트 후기 조회
 */
export async function getBestReviews(limit = 10) {
    const supabase = await createClient()

    const { data: reviews, error } = await supabase
        .from("reviews")
        .select(
            `
      *,
      profiles(
        id,
        full_name,
        avatar_url,
        role,
        company,
        position
      ),
      events(
        id,
        title,
        event_date,
        thumbnail_url
      )
    `
        )
        .eq("is_public", true)
        .eq("is_best", true)
        .order("created_at", { ascending: false })
        .limit(limit)

    if (error) {
        console.error("베스트 후기 조회 실패:", error)
        throw new Error("베스트 후기를 불러오는데 실패했습니다.")
    }

    return reviews as ReviewForDisplay[]
}

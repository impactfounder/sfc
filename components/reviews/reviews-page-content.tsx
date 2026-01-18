import { createClient } from "@/lib/supabase/server"
import { getAllReviewsWithFilters } from "@/lib/queries/reviews"
import { ReviewsMasonryGrid } from "./reviews-masonry-grid"

export async function ReviewsPageContent() {
  const supabase = await createClient()
  const reviews = await getAllReviewsWithFilters(supabase, {
    limit: 100,
    sortBy: "latest",
  })

  return (
    <div className="w-full space-y-6">
      {/* 헤더 */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">참가자 후기</h1>
        <p className="text-slate-500">
          서울 파운더스 클럽 이벤트에 참가한 멤버들의 생생한 후기를 확인해보세요.
        </p>
      </div>

      {/* Masonry Grid */}
      <ReviewsMasonryGrid initialReviews={reviews} />
    </div>
  )
}

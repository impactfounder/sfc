import { createClient } from "@/lib/supabase/server"
import { getLatestReviews } from "@/lib/queries/posts"
import { PhotoReviewsSection } from "./photo-reviews-section"

export async function PhotoReviewsContainer() {
  const supabase = await createClient()
  const reviews = await getLatestReviews(supabase, 20)

  // 이미지가 있는 후기만 필터링
  const photoReviews = reviews.filter(r => r.images && r.images.length > 0)

  if (photoReviews.length === 0) {
    return null
  }

  return <PhotoReviewsSection reviews={photoReviews} />
}

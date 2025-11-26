/**
 * 홈 페이지 관련 타입 정의
 * 홈 페이지에서 사용하는 데이터 타입
 */

import type { EventCardEvent } from "@/components/ui/event-card"
import type { PostForDisplay } from "./posts"
import type { ReviewForDisplay } from "./posts"
import type { BoardCategory } from "./posts"
import type { User } from "./profile"
import type { Profile } from "./profile"

/**
 * 홈 페이지 초기 데이터 타입
 */
export type HomePageData = {
  announcement: { id: string; title: string } | null
  events: EventCardEvent[]
  posts: PostForDisplay[]
  eventRequests: PostForDisplay[]
  reviews: ReviewForDisplay[]
  boardCategories: BoardCategory[]
  user: User | null
  profile: Profile | null
}

/**
 * 홈 페이지 클라이언트 컴포넌트 Props 타입
 */
export type HomePageClientProps = {
  children?: React.ReactNode
  initialAnnouncement?: { id: string; title: string } | null
  initialEvents?: EventCardEvent[]
  initialPosts?: PostForDisplay[]
  initialEventRequests?: PostForDisplay[]
  initialReviews?: ReviewForDisplay[]
  initialBoardCategories?: BoardCategory[]
  initialUser?: User | null
  initialProfile?: Profile | null
}


/**
 * 게시글 관련 타입 정의
 * Supabase posts 테이블 및 관련 테이블 타입
 */

/**
 * 게시글 데이터베이스 스키마 타입
 * posts 테이블의 모든 컬럼을 포함
 */
export type Post = {
  id: string
  title: string
  content: string
  author_id: string
  board_category_id: string | null
  community_id: string | null
  related_event_id: string | null
  visibility: "public" | "group"
  likes_count: number
  comments_count: number
  created_at: string
  updated_at: string
}

/**
 * 게시판 카테고리 타입
 */
export type BoardCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  order_index: number
  is_active: boolean
}

/**
 * 게시글 표시용 타입 (조인된 데이터 포함)
 * lib/queries/posts.ts의 PostForDisplay와 호환
 */
export type PostForDisplay = {
  id: string
  title: string
  content?: string | null
  created_at: string
  visibility?: "public" | "group"
  likes_count?: number
  comments_count?: number
  profiles?: {
    id?: string
    full_name?: string | null
    avatar_url?: string | null
  } | null
  board_categories?: {
    name?: string | null
    slug?: string | null
  } | null
  communities?: {
    name?: string | null
  } | null
}

/**
 * 후기 표시용 타입
 * lib/queries/posts.ts의 ReviewForDisplay와 호환
 */
export type ReviewForDisplay = {
  id: string
  title: string
  content?: string | null
  created_at: string
  likes_count?: number
  comments_count?: number
  profiles?: {
    id?: string
    full_name?: string | null
    avatar_url?: string | null
  } | null
  events?: {
    id?: string
    title?: string | null
    thumbnail_url?: string | null
  } | null
}

/**
 * 프로필 페이지에서 사용하는 게시글 리스트 아이템 타입
 */
export type PostListItem = {
  id: string
  title: string
  created_at: string
  board_categories?: {
    name: string | null
    slug: string | null
  } | null
  likes_count?: number
  comments_count?: number
}


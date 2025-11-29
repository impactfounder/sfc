/**
 * 뱃지 관련 타입 정의
 * Supabase badges 및 user_badges 테이블 타입
 */

/**
 * 뱃지 데이터베이스 스키마 타입
 * badges 테이블의 모든 컬럼을 포함
 */
export type Badge = {
  id: string
  name: string
  icon: string
  category: string
  description: string | null
  is_active?: boolean | null // 뱃지 공개/비공개 상태 (관리자용)
  created_at: string
}

/**
 * 사용자 뱃지 데이터베이스 스키마 타입
 * user_badges 테이블의 모든 컬럼을 포함
 */
export type UserBadge = {
  id: string
  user_id: string
  badge_id: string
  is_visible: boolean
  status?: 'pending' | 'approved' | 'rejected' | null
  evidence?: string | null
  created_at: string
  updated_at: string
}

/**
 * 사용자 뱃지 (뱃지 정보 포함)
 * 조인된 쿼리 결과 타입
 */
export type UserBadgeWithBadge = UserBadge & {
  badges: Badge | null
}

/**
 * 표시용 뱃지 타입 (간소화)
 */
export type VisibleBadge = {
  icon: string
  name: string
}

/**
 * 뱃지 카테고리 타입
 */
export type BadgeCategory =
  | "personal_asset"
  | "corporate_revenue"
  | "investment"
  | "valuation"
  | "influence"
  | "professional_license"
  | "community"


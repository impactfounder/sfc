/**
 * 프로필 관련 타입 정의
 * Supabase profiles 테이블 및 auth.users와 연관된 타입
 */

import type { User as SupabaseUser } from "@supabase/supabase-js"

/**
 * Supabase Auth User 타입 (확장 가능)
 */
export type User = SupabaseUser

/**
 * 프로필 데이터베이스 스키마 타입
 * profiles 테이블의 모든 컬럼을 포함
 */
export type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  role: "member" | "admin" | "master"
  roles: string[] | null
  points: number
  company: string | null
  position: string | null
  company_2: string | null // 추가
  position_2: string | null // 추가
  introduction: string | null
  is_profile_public: boolean
  membership_tier: string | null
  last_login_date: string | null
  linkedin_url: string | null
  instagram_url: string | null
  threads_url: string | null
  website_url: string | null
  created_at: string
  updated_at: string
}

/**
 * 프로필 표시용 타입 (일부 필드만 선택)
 */
export type ProfileForDisplay = {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: "member" | "admin" | "master"
  points: number
  company: string | null
  position: string | null
  company_2: string | null // 추가
  position_2: string | null // 추가
  introduction: string | null
  is_profile_public: boolean
  bio: string | null
  created_at: string
}

/**
 * 사용자와 프로필을 함께 반환하는 타입
 */
export type UserWithProfile = {
  user: User
  profile: Profile | null
}

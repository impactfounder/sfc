/**
 * 이벤트 관련 타입 정의
 * Supabase events 테이블 및 관련 테이블 타입
 */

/**
 * 이벤트 데이터베이스 스키마 타입
 * events 테이블의 모든 컬럼을 포함
 */
export type Event = {
  id: string
  title: string
  description: string
  event_date: string
  end_date: string | null
  location: string | null
  price: number | null
  max_participants: number | null
  thumbnail_url: string | null
  event_type: "networking" | "class" | "activity" | null
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * 이벤트 표시용 타입 (조인된 데이터 포함)
 */
export type EventForDisplay = {
  id: string
  title: string
  thumbnail_url?: string | null
  event_date: string
  event_time?: string | null
  location?: string | null
  max_participants?: number | null
  current_participants: number
  event_type?: "networking" | "class" | "activity" | null
}

/**
 * 이벤트 상세 정보 타입 (프로필 정보 포함)
 */
export type EventWithProfile = Event & {
  profiles?: {
    id: string
    full_name: string | null
    avatar_url: string | null
    bio: string | null
  } | null
}

/**
 * 이벤트 등록 정보 타입
 * event_registrations 테이블
 */
export type EventRegistration = {
  id: string
  event_id: string
  user_id: string | null
  guest_name: string | null
  guest_contact: string | null
  registered_at: string
  status?: string | null
}

/**
 * 이벤트 등록 정보 (이벤트 정보 포함)
 */
export type EventRegistrationWithEvent = EventRegistration & {
  events: Event | null
}

/**
 * 프로필 페이지에서 사용하는 이벤트 리스트 아이템 타입
 */
export type EventListItem = {
  id: string
  title: string
  thumbnail_url: string | null
  event_date: string
  location: string | null
  created_at: string
  registration_date?: string | null
  status?: string | null
}

/**
 * 이벤트 생성 시 사용하는 데이터 타입
 */
export type EventInsertData = {
  title: string
  description: string
  event_date: string
  end_date?: string | null
  location?: string | null
  price?: number | null
  max_participants?: number | null
  thumbnail_url?: string | null
  event_type?: "networking" | "class" | "activity" | null
  created_by: string
}

/**
 * 이벤트 수정 시 사용하는 데이터 타입
 */
export type EventUpdateData = {
  title: string
  description: string
  event_date: string
  end_date?: string | null
  location?: string | null
  price?: number | null
  max_participants?: number | null
  thumbnail_url?: string | null
  event_type?: "networking" | "class" | "activity" | null
  updated_at: string
}

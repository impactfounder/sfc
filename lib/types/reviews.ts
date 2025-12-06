/**
 * 후기(Reviews) 관련 타입 정의
 * Supabase reviews 테이블 및 관련 타입
 */

/**
 * 후기 데이터베이스 스키마 타입
 * reviews 테이블의 모든 컬럼을 포함
 */
export type Review = {
    id: string
    user_id: string
    event_id: string // 필수 필드
    rating: number // 0.5 ~ 5.0 (반개 단위)
    keywords: string[]
    one_liner: string // 20-100자
    detail_content: string | null
    images: string[]
    is_best: boolean
    is_public: boolean
    created_at: string
    updated_at: string
}

/**
 * 후기 생성 시 사용하는 데이터 타입
 */
export type ReviewInsertData = {
    user_id: string
    event_id: string // 필수
    rating: number // 0.5 ~ 5.0
    keywords: string[]
    one_liner: string
    detail_content?: string | null
    images?: string[]
    is_public?: boolean
}

/**
 * 후기 수정 시 사용하는 데이터 타입
 */
export type ReviewUpdateData = Partial<Omit<ReviewInsertData, "user_id">>

/**
 * 후기 표시용 타입 (프로필 정보 포함)
 */
export type ReviewForDisplay = Review & {
    profiles: {
        id: string
        full_name: string | null
        avatar_url: string | null
        role: "member" | "admin" | "master"
        company: string | null
        position: string | null
    } | null
    events: {
        id: string
        title: string
        event_date: string
        thumbnail_url: string | null
    }
}

/**
 * 미리 정의된 키워드 목록
 */
export const REVIEW_KEYWORDS = [
    "⚡️ 동기부여",
    "🧠 새로운 관점",
    "🤝 좋은 인맥",
    "🛠 실무 꿀팁",
    "💼 투자 기회",
    "🍷 즐거운 분위기",
    "🌿 힐링/충전",
    "🗣️ 자유로운 소통",
    "🎉 알찬 구성",
    "🧸 가벼운 시작",
] as const

export type ReviewKeyword = (typeof REVIEW_KEYWORDS)[number]

import { createClient } from "@/lib/supabase/server"
import { ReviewModal } from "@/components/reviews/review-modal"
import { ReviewCard } from "@/components/reviews/review-card"
import type { ReviewForDisplay } from "@/lib/types/reviews"

// 목 데이터
const mockReviews: ReviewForDisplay[] = [
    {
        id: "1",
        user_id: "mock-user-1",
        event_id: "event-1",
        rating: 4.5,
        keywords: ["🍷 즐거운 분위기", "🌿 힐링/충전", "🎉 알찬 구성"],
        one_liner: "지친 일상에서 벗어나 에너지를 가득 충전하고 갑니다!",
        detail_content:
            "처음엔 단순한 네트워킹 모임이라고 생각했는데, 실제로 겪고 있는 어려움들을 허심탄회하게 나눌 수 있었습니다. 특히 제조업 스타트업을 운영하시는 분의 조언이 정말 도움이 많이 되었어요. 다음에도 꼭 참여하고 싶습니다!",
        images: [],
        is_best: true,
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profiles: {
            id: "mock-user-1",
            full_name: "김창업",
            avatar_url: null,
            role: "member",
            company: "스타트업코리아",
            position: "대표",
        },
        events: {
            id: "event-1",
            title: "창업가 네트워킹 모임 - 12월",
            event_date: new Date(Date.now() - 432000000).toISOString(),
            thumbnail_url: null,
        },
    },
    {
        id: "2",
        user_id: "mock-user-2",
        event_id: "event-2",
        rating: 5.0,
        keywords: ["🧠 새로운 관점", "💼 투자 기회"],
        one_liner: "투자자 관점에서 바라본 시장 분석이 눈을 뜨게 해줬습니다",
        detail_content: null,
        images: [],
        is_best: false,
        is_public: true,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        profiles: {
            id: "mock-user-2",
            full_name: "이사업",
            avatar_url: null,
            role: "member",
            company: "테크벤처스",
            position: "CTO",
        },
        events: {
            id: "event-2",
            title: "스타트업 투자 세미나",
            event_date: new Date(Date.now() - 864000000).toISOString(),
            thumbnail_url: null,
        },
    },
    {
        id: "3",
        user_id: "mock-user-3",
        event_id: "event-3",
        rating: 4.0,
        keywords: ["🗣️ 자유로운 소통", "🧸 가벼운 시작", "🤝 좋은 인맥"],
        one_liner: "편안한 분위기에서 진솔한 대화를 나눌 수 있었어요",
        detail_content: null,
        images: [],
        is_best: false,
        is_public: true,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date(Date.now() - 172800000).toISOString(),
        profiles: {
            id: "mock-user-3",
            full_name: "박혁신",
            avatar_url: null,
            role: "admin",
            company: "이노베이션랩",
            position: "팀장",
        },
        events: {
            id: "event-3",
            title: "SFC 정기 모임",
            event_date: new Date(Date.now() - 1728000000).toISOString(),
            thumbnail_url: null,
        },
    },
    {
        id: "4",
        user_id: "mock-user-4",
        event_id: "event-1",
        rating: 3.5,
        keywords: ["⚡️ 동기부여"],
        one_liner: "다시 도전할 용기를 얻었습니다. 감사합니다!",
        detail_content: null,
        images: [],
        is_best: false,
        is_public: true,
        created_at: new Date(Date.now() - 259200000).toISOString(),
        updated_at: new Date(Date.now() - 259200000).toISOString(),
        profiles: {
            id: "mock-user-4",
            full_name: "최도전",
            avatar_url: null,
            role: "member",
            company: null,
            position: "예비창업자",
        },
        events: {
            id: "event-1",
            title: "창업가 네트워킹 모임 - 12월",
            event_date: new Date(Date.now() - 432000000).toISOString(),
            thumbnail_url: null,
        },
    },
]

export default async function ReviewTestPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <div className="container max-w-7xl mx-auto px-4 py-12 space-y-8">
                {/* 헤더 */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        후기 시스템 테스트
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        가벼운 회고 시스템을 테스트해보세요. 별점, 키워드, 한 줄 평으로 간편하게 후기를 남길 수 있습니다.
                    </p>
                </div>

                {/* 후기 작성 버튼 */}
                <div className="flex justify-center">
                    {user ? (
                        <ReviewModal userId={user.id} eventId="event-1" />
                    ) : (
                        <div className="text-center p-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur rounded-lg border">
                            <p className="text-muted-foreground mb-4">
                                후기를 작성하려면 로그인이 필요합니다
                            </p>
                            <a
                                href="/auth/login"
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                            >
                                로그인하기
                            </a>
                        </div>
                    )}
                </div>

                {/* 구분선 */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-white dark:bg-slate-950 px-4 text-muted-foreground">
                            작성된 후기
                        </span>
                    </div>
                </div>

                {/* 후기 카드 - 2열 그리드 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {mockReviews.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                    ))}
                </div>

                {/* 안내문 */}
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-6">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        💡 테스트 페이지 안내
                    </h3>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                        <li>• 위 후기들은 목(Mock) 데이터입니다</li>
                        <li>• 모든 후기는 특정 이벤트/행사와 연결됩니다</li>
                        <li>• 별점은 0.5점 단위로 선택 가능합니다 (별 왼쪽 클릭: 0.5점, 오른쪽 클릭: 1점)</li>
                        <li>• 키워드는 중복 선택이 가능합니다</li>
                        <li>• 한 줄 평은 20자 이상 100자 이하로 작성해야 합니다</li>
                        <li>• 상세 후기와 이미지는 선택 사항입니다</li>
                    </ul>
                </div>

                {/* Supabase 마이그레이션 안내 */}
                <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-lg p-6">
                    <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                        ⚠️ 데이터베이스 마이그레이션 필요
                    </h3>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                        실제로 후기를 작성하려면 먼저 Supabase에서 마이그레이션을 실행해야 합니다:
                    </p>
                    <ol className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 list-decimal list-inside">
                        <li>Supabase 대시보드 → SQL Editor로 이동</li>
                        <li>
                            <code className="bg-yellow-100 dark:bg-yellow-900 px-1 py-0.5 rounded text-xs">
                                scripts/050_create_reviews_table.sql
                            </code>{" "}
                            파일 내용 복사
                        </li>
                        <li>SQL Editor에 붙여넣고 "Run" 클릭</li>
                        <li>Table Editor에서 "reviews" 테이블 생성 확인</li>
                    </ol>
                </div>
            </div>
        </div>
    )
}

import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { PostsSection } from "@/components/home/posts-section"
import { getLatestPosts } from "@/lib/queries/posts"
import { getBoardCategories } from "@/lib/queries/board-categories"

export default async function CommunityDashboardPage() {
  const supabase = await createClient()

  // 현재 사용자 정보 가져오기 (멤버십 체크용)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch data using query helpers (피드에만 집중)
  // getLatestPosts에 'all'을 전달하면 소모임 글만 가져옴 (공지사항/자유게시판 제외)
  const [transformedPosts, boardCategories] = await Promise.all([
    getLatestPosts(supabase, 50, 'all'),
    getBoardCategories(supabase),
  ])

  // 공지사항과 자유게시판 제외 (소모임 카테고리만 표시)
  // 'free-board'는 게시글에는 포함되지만 카테고리 탭에서는 제외
  const excludedSlugs = ['announcement', 'announcements', 'free', 'free-board']
  const filteredBoardCategories = (boardCategories || []).filter(
    (cat) => !excludedSlugs.includes(cat.slug)
  )

  // 각 게시글의 커뮤니티 멤버십 확인 (나중에 최적화 가능)
  // 주의: communities 조인이 제거되었으므로 임시로 모든 게시글에 isMember: true 설정
  const postsWithMembership = transformedPosts.map((post: any) => {
    // TODO: 실제 community_id를 가져와서 멤버십 체크
    // 현재는 communities 조인이 제거되어 임시로 true로 설정
    // visibility가 'group'인 경우 나중에 실제 멤버십 체크 로직 추가 필요
    return { ...post, isMember: true }
  })

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        {/* Latest Posts Section - 피드에만 집중 */}
        <Card>
          <CardContent className="pt-6">
            <PostsSection
              posts={postsWithMembership}
              boardCategories={filteredBoardCategories}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

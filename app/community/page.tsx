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
  const [transformedPosts, boardCategories] = await Promise.all([
    getLatestPosts(supabase, 50),
    getBoardCategories(supabase),
  ])

  // 공지사항과 자유게시판 제외 (소모임 카테고리만 표시)
  const excludedSlugs = ['announcement', 'announcements', 'free', 'free-board']
  const filteredBoardCategories = (boardCategories || []).filter(
    (cat) => !excludedSlugs.includes(cat.slug)
  )

  // 게시글에서도 공지사항과 자유게시판 제외
  const filteredPosts = transformedPosts.filter((post: any) => {
    const postSlug = post.board_categories?.slug
    return postSlug && !excludedSlugs.includes(postSlug)
  })

  // 각 게시글의 커뮤니티 멤버십 확인 (나중에 최적화 가능)
  const postsWithMembership = await Promise.all(
    filteredPosts.map(async (post: any) => {
      // community_id가 있고 visibility가 'group'인 경우에만 체크
      if (post.communities && post.visibility === "group" && user) {
        // TODO: 실제 community_id를 가져와서 멤버십 체크
        // 임시로 true로 설정 (나중에 로직 추가)
        return { ...post, isMember: true }
      }
      // public이거나 로그인하지 않은 경우는 항상 true (public은 모두 볼 수 있음)
      return { ...post, isMember: true }
    })
  )

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

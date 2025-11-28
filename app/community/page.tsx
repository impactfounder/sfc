import { createClient } from "@/lib/supabase/server"
import { PostsSection } from "@/components/home/posts-section"
import { getLatestPosts } from "@/lib/queries/posts"
import { getBoardCategories } from "@/lib/queries/board-categories"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"
import type { PostForDisplay } from "@/lib/types/posts"

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

  // SFC 운영 커뮤니티 필터링 (반골, 하이토크만)
  const featuredCommunities = (boardCategories || []).filter(
    (cat) => cat.slug === 'vangol' || cat.slug === 'hightalk'
  )

  // 공지사항과 자유게시판 제외 (소모임 카테고리만 표시)
  // 'free-board'는 게시글에는 포함되지만 카테고리 탭에서는 제외
  const excludedSlugs = ['announcement', 'announcements', 'free', 'free-board']
  const filteredBoardCategories = (boardCategories || []).filter(
    (cat) => !excludedSlugs.includes(cat.slug)
  )

  // 각 게시글의 커뮤니티 멤버십 확인
  // 주의: communities 조인이 제거되었으므로 임시로 모든 게시글에 isMember: true 설정
  // 향후 개선: visibility가 'group'인 경우 실제 멤버십 체크 로직 추가 필요
  const postsWithMembership = transformedPosts.map((post: PostForDisplay) => {
    return { ...post, isMember: true }
  })

  // 클럽 설명 매핑
  const getClubDescription = (slug: string) => {
    switch (slug) {
      case 'vangol':
        return '반골 모임 커뮤니티'
      case 'hightalk':
        return '하이토크 모임 커뮤니티'
      default:
        return '커뮤니티'
    }
  }

  // 클럽 아바타 텍스트 (이미지가 없을 때 사용)
  const getClubAvatarText = (name: string) => {
    return name.charAt(0)
  }

  return (
    <div className="w-full flex flex-col lg:flex-row gap-10 pt-8 pb-20">
      {/* [LEFT] 중앙 콘텐츠 영역 */}
      <div className="flex-1 min-w-0 flex flex-col gap-10">
        {/* 커뮤니티 섹션 */}
        {featuredCommunities.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">커뮤니티</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredCommunities.map((community) => (
                <Link
                  key={community.id}
                  href={`/community/board/${community.slug}`}
                  className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-all flex gap-4 group min-h-[120px]"
                >
                  <div className="flex-shrink-0">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={undefined} alt={community.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-2xl font-bold text-indigo-600">
                        {getClubAvatarText(community.name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">
                        {community.name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {getClubDescription(community.slug)}
                      </p>
                    </div>
                    <div className="flex items-center justify-end mt-2">
                      <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 최신 글 피드 섹션 */}
        <PostsSection
          posts={postsWithMembership}
          boardCategories={filteredBoardCategories}
          selectedBoard="all"
          hideTabs={false}
        />
      </div>

      {/* [RIGHT] 우측 사이드바 영역 */}
      <div className="hidden lg:flex w-72 shrink-0 flex-col gap-6">
        <div className="sticky top-8 flex flex-col gap-6 h-fit">
          <StandardRightSidebar />
        </div>
      </div>
    </div>
  )
}

import { createClient } from "@/lib/supabase/server"
import { PostsSection } from "@/components/home/posts-section"
import { getLatestPosts } from "@/lib/queries/posts"
import { getBoardCategories } from "@/lib/queries/board-categories"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"
import { CommunityIntro } from "@/components/community-intro"
import type { PostForDisplay } from "@/lib/types/posts"

export default async function CommunityDashboardPage() {
  const supabase = await createClient()

  // 현재 사용자 정보 가져오기 (권한 체크용)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let canEdit = false
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, roles")
      .eq("id", user.id)
      .single()
    
    // master 또는 community_leader 권한 확인
    if (profile?.role === 'master' || profile?.roles?.includes('community_leader')) {
      canEdit = true
    }
  }

  // 커뮤니티 소개글 가져오기
  const { data: setting } = await supabase
    .from("community_settings")
    .select("value")
    .eq("key", "community_intro")
    .single()
  
  const communityIntro = setting?.value || "다양한 주제로 소통하고 함께 성장하는 공간입니다."
  // getLatestPosts에 'all'을 전달하면 소모임 글만 가져옴 (공지사항/자유게시판 제외)
  const [transformedPosts, boardCategories] = await Promise.all([
    getLatestPosts(supabase, 50, 'all'),
    getBoardCategories(supabase),
  ])

  // SFC 운영 커뮤니티 필터링 (반골, 하이토크만)
  const featuredCommunities = (boardCategories || []).filter(
    (cat) => cat.slug === 'vangol' || cat.slug === 'hightalk'
  )

  // 실제 개설된 커뮤니티(소모임) 슬러그 목록
  const communitySlugs = ['vangol', 'hightalk']

  // 탭 메뉴용 카테고리 필터링 (반골, 하이토크만)
  const filteredBoardCategories = (boardCategories || []).filter(
    (cat) => communitySlugs.includes(cat.slug)
  )

  // 게시글 데이터 필터링 (반골, 하이토크 게시글만)
  // getLatestPosts('all')은 인사이트 등 다른 글도 포함하므로 여기서 한번 더 필터링
  const communityPosts = transformedPosts.filter(post => 
    post.board_categories?.slug && communitySlugs.includes(post.board_categories.slug)
  )

  // 각 게시글의 커뮤니티 멤버십 확인
  // 주의: communities 조인이 제거되었으므로 임시로 모든 게시글에 isMember: true 설정
  // 향후 개선: visibility가 'group'인 경우 실제 멤버십 체크 로직 추가 필요
  const postsWithMembership = communityPosts.map((post: PostForDisplay) => {
    return { ...post, isMember: true }
  })

  // 각 커뮤니티의 description과 멤버 수 가져오기
  const communityDescriptions = new Map<string, string>()
  const communityMemberCounts = new Map<string, number>()
  
  for (const community of featuredCommunities) {
    // communities 테이블에서 id와 description 가져오기
    const { data: communityData } = await supabase
      .from("communities")
      .select("id, description")
      .eq("name", community.name)
      .maybeSingle()
    
    if (communityData?.description) {
      communityDescriptions.set(community.slug, communityData.description)
    } else {
      // 기본값 설정
      communityDescriptions.set(
        community.slug, 
        `${community.name} 커뮤니티`
      )
    }

    // 멤버 수 가져오기
    if (communityData?.id) {
      const { count } = await supabase
        .from("community_members")
        .select("*", { count: "exact", head: true })
        .eq("community_id", communityData.id)
      
      communityMemberCounts.set(community.slug, count || 0)
    } else {
      communityMemberCounts.set(community.slug, 0)
    }
  }

  // 클럽 아바타 텍스트 (이미지가 없을 때 사용)
  const getClubAvatarText = (name: string) => {
    return name.charAt(0)
  }

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* [LEFT] 메인 콘텐츠 영역 */}
      <main className="lg:col-span-9 flex flex-col gap-6">
        {/* 배너: 커뮤니티 소개 (편집 가능) */}
        <CommunityIntro 
          initialIntro={communityIntro} 
          canEdit={canEdit} 
        />

        {/* 커뮤니티 섹션 */}
        {featuredCommunities.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-6">커뮤니티</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredCommunities.map((community) => (
                <Link
                  key={community.id}
                  href={`/community/board/${community.slug}`}
                  className="bg-white border border-slate-200 rounded-xl p-8 hover:shadow-md transition-all flex gap-4 group min-h-[240px]"
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
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-slate-900">
                          {community.name}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {communityMemberCounts.get(community.slug) || 0}명
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 whitespace-pre-wrap">
                        {communityDescriptions.get(community.slug) || `${community.name} 커뮤니티`}
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
      </main>

      {/* [RIGHT] 우측 사이드바 영역 */}
      <aside className="hidden lg:block lg:col-span-3">
        <div className="sticky top-8 flex flex-col gap-6 h-fit">
          <StandardRightSidebar />
        </div>
      </aside>
    </div>
  )
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Calendar, Shield, Megaphone, MessageSquare, Home, Users, Lightbulb, BookOpen, Ticket, Zap, Headset, Briefcase, Hash } from "lucide-react"
import { useRef, useEffect, useState } from "react"
import { usePrefetchPosts } from "@/lib/hooks/usePrefetchPosts"
import { createClient } from "@/lib/supabase/client"

interface SidebarProps {
  userRole?: string | null
}

interface JoinedCommunity {
  id: string
  name: string
  slug: string
}

const navigationSections = [
  {
    title: null, // 소개 섹션은 타이틀 없음
    links: [
      { name: "SEOUL FOUNDERS CLUB", href: "/about", icon: BookOpen },
      { name: "멤버", href: "/member", icon: Users }
    ],
    groupStyle: "major"
  },
  {
    title: "성장",
    links: [
      { name: "이벤트", href: "/e", icon: Calendar },
      { name: "인사이트", href: "/community/board/insights", icon: Zap },
      { name: "파트너스", href: "/partners", icon: Briefcase }
    ],
    groupStyle: "major"
  },
  {
    title: "게시판",
    links: [
      { name: "공지사항", href: "/community/board/announcements", icon: Megaphone },
      { name: "자유게시판", href: "/community/board/free", icon: MessageSquare }
    ],
    groupStyle: "board"
  },
  {
    title: null, // 섹션 타이틀 제거
    links: [
      { name: "커뮤니티", href: "/community", icon: Ticket },
    ],
    groupStyle: "brand",
    showJoinedCommunities: true, // 가입한 커뮤니티 표시 플래그
  },
]

// sessionStorage 키
const COMMUNITIES_CACHE_KEY = 'sidebar_joined_communities'

// 캐시에서 커뮤니티 목록 가져오기
function getCachedCommunities(): JoinedCommunity[] {
  if (typeof window === 'undefined') return []
  try {
    const cached = sessionStorage.getItem(COMMUNITIES_CACHE_KEY)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch (e) {
    console.error("[Sidebar] Cache read error:", e)
  }
  return []
}

// 커뮤니티 목록 캐시에 저장
function setCachedCommunities(communities: JoinedCommunity[]) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(COMMUNITIES_CACHE_KEY, JSON.stringify(communities))
  } catch (e) {
    console.error("[Sidebar] Cache write error:", e)
  }
}

export function Sidebar({ userRole: initialUserRole }: SidebarProps) {
  const pathname = usePathname()
  const prefetch = usePrefetchPosts()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [userRole, setUserRole] = useState<string | null>(initialUserRole || null)
  // 서버/클라이언트 일관성을 위해 빈 배열로 초기화 (캐시는 useEffect에서 로드)
  const [joinedCommunities, setJoinedCommunities] = useState<JoinedCommunity[]>([])
  const loadingRef = useRef(false)
  const cacheLoadedRef = useRef(false)

  // 클라이언트에서 인증 상태 체크 및 가입한 커뮤니티 로드
  useEffect(() => {
    const supabase = createClient()
    let isMounted = true

    async function loadCommunities(userId: string) {
      if (!isMounted) return

      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseKey) return

        const fetchUrl = `${supabaseUrl}/rest/v1/community_members?select=community_id&user_id=eq.${userId}`

        const membershipsRes = await fetch(
          fetchUrl,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            },
          }
        )

        if (!membershipsRes.ok) return

        const memberships = await membershipsRes.json()

        if (!isMounted) return

        if (memberships && memberships.length > 0) {
          const communityIds = memberships.map((m: any) => m.community_id)

          // communities 조회
          const communitiesRes = await fetch(
            `${supabaseUrl}/rest/v1/communities?select=id,name&id=in.(${communityIds.join(',')})`,
            {
              headers: {
                'apikey': supabaseKey!,
                'Authorization': `Bearer ${supabaseKey}`,
              },
            }
          )

          const communities = await communitiesRes.json()

          if (!isMounted) return

          if (communities && communities.length > 0) {
            const communityNames = communities.map((c: any) => c.name)

            // board_categories 조회
            const categoriesRes = await fetch(
              `${supabaseUrl}/rest/v1/board_categories?select=name,slug&name=in.(${communityNames.map((n: string) => `"${n}"`).join(',')})`,
              {
                headers: {
                  'apikey': supabaseKey!,
                  'Authorization': `Bearer ${supabaseKey}`,
                },
              }
            )

            const categories = await categoriesRes.json()

            const communityList: JoinedCommunity[] = communities.map((community: any) => {
              const category = categories?.find((c: any) => c.name === community.name)
              return {
                id: community.id,
                name: community.name,
                slug: category?.slug || community.name.toLowerCase().replace(/\s+/g, '-'),
              }
            })

            if (isMounted) {
              setJoinedCommunities(communityList)
              setCachedCommunities(communityList) // 캐시에 저장
            }
          }
        }
      } catch (error) {
        // Silent fail
      }
    }

    async function initLoad() {
      if (loadingRef.current) return
      loadingRef.current = true

      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user && isMounted) {
          // 로그인 상태에서만 캐시 로드 (hydration 이후)
          if (!cacheLoadedRef.current) {
            cacheLoadedRef.current = true
            const cached = getCachedCommunities()
            if (cached.length > 0) {
              setJoinedCommunities(cached)
            }
          }

          // 역할 가져오기
          if (!initialUserRole) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", session.user.id)
              .single()
            if (isMounted) setUserRole(profile?.role || null)
          }

          // 커뮤니티 로드
          await loadCommunities(session.user.id)
        } else {
          // 로그인하지 않은 경우 캐시와 커뮤니티 목록 초기화
          if (isMounted) {
            setJoinedCommunities([])
            setCachedCommunities([])
          }
        }
      } catch (error) {
        // Silent fail
      } finally {
        loadingRef.current = false
      }
    }

    initLoad()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return

      if (session?.user) {
        // 역할 가져오기
        if (!initialUserRole) {
          supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single()
            .then(({ data: profile }) => {
              if (isMounted) setUserRole(profile?.role || null)
            })
        }

        // 커뮤니티 로드
        loadCommunities(session.user.id)
      } else {
        // 로그아웃 시 커뮤니티 목록 초기화
        if (isMounted) {
          setJoinedCommunities([])
          setCachedCommunities([]) // 캐시도 초기화
          setUserRole(null)
        }
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [initialUserRole])

  const isAdmin = userRole === "admin" || userRole === "master"
  const showAdminMenu = isAdmin || pathname.startsWith('/admin')

  const isLinkActive = (href: string, startsWith = false) => {
    if (href === '/community' || href === '/community/page') {
      return pathname === href
    }
    return startsWith ? pathname.startsWith(href) : pathname === href
  }

  useEffect(() => {
    const sidebar = sidebarRef.current
    if (!sidebar) return

    const handleWheel = (e: WheelEvent) => {
      const isScrollable = sidebar.scrollHeight > sidebar.clientHeight
      const isAtTop = sidebar.scrollTop <= 1
      const isAtBottom = sidebar.scrollTop + sidebar.clientHeight >= sidebar.scrollHeight - 5

      if (isScrollable) {
        if ((e.deltaY < 0 && !isAtTop) || (e.deltaY > 0 && !isAtBottom)) {
          e.stopPropagation()
        }
      }
    }

    sidebar.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      sidebar.removeEventListener('wheel', handleWheel)
    }
  }, [])

  return (
    <div className="flex h-full w-full flex-col bg-white border-r border-slate-100 shadow-sm overflow-hidden">
      <nav
        ref={sidebarRef}
        className="flex-1 px-3 py-4 overflow-y-auto overflow-x-hidden no-scrollbar"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* 1. 홈 (Top Level) */}
        <div className="space-y-0.5 mb-1">
          <Link
            href="/"
            prefetch={true}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-5 py-1.5 text-[15px] transition-all",
              isLinkActive("/") ? "bg-slate-100 text-slate-900 font-medium" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-normal",
            )}
          >
            <Home className="h-4 w-4 flex-shrink-0" />
            <span>홈</span>
          </Link>
        </div>

        {/* 2. 구조화된 메뉴 섹션 */}
        {navigationSections.map((section, sectionIndex) => (
          <div key={section.title || sectionIndex}>
            {/* 섹션 구분선 (첫 번째 섹션 제외) */}
            {sectionIndex > 0 && (
              <div className="my-2 mx-5 border-t border-slate-200" />
            )}

            <div className="py-1">
              {/* 타이틀이 있는 경우에만 표시 */}
              {section.title && (
                <div className="px-5 mb-1.5">
                  <span className="text-[11px] font-medium text-slate-500">
                    {section.title}
                  </span>
                </div>
              )}

              <div className="space-y-0.5">
                {section.links.map((item) => {
                  const useExactMatch = item.href === "/community"
                  const isActive = isLinkActive(item.href, !useExactMatch)
                  const Icon = item.icon
                  const isBoardLink = item.href.startsWith("/community/board/")
                  const boardSlug = isBoardLink ? item.href.split("/").pop() : null
                  let dbSlug = boardSlug
                  if (boardSlug === 'free') dbSlug = 'free-board'
                  if (boardSlug === 'announcements') dbSlug = 'announcement'

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      prefetch={true}
                      onMouseEnter={() => {
                        if (isBoardLink && dbSlug) {
                          prefetch(dbSlug)
                        }
                      }}
                      className={cn(
                        "flex items-center gap-2.5 px-5 py-1.5 text-[15px] transition-all rounded-lg",
                        isActive ? "bg-slate-100 text-slate-900 font-medium" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-normal",
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}

                {/* 가입한 커뮤니티 목록 (해당 섹션에만 표시) */}
                {(section as any).showJoinedCommunities && joinedCommunities.length > 0 && (
                  <div className="space-y-px ml-4">
                    {joinedCommunities.map((community) => {
                      const communityHref = `/community/board/${community.slug}`
                      const isActive = pathname === communityHref || pathname.startsWith(`${communityHref}/`)

                      return (
                        <Link
                          key={community.id}
                          href={communityHref}
                          prefetch={true}
                          onMouseEnter={() => prefetch(community.slug)}
                          className={cn(
                            "flex items-center gap-2 px-4 py-1 text-[13px] transition-all rounded-lg",
                            isActive ? "bg-slate-100 text-slate-900 font-medium" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-normal",
                          )}
                        >
                          <Hash className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{community.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* 3. 기타 및 관리자 섹션 */}
        <div>
          <div className="my-2 mx-5 border-t border-slate-200" />
          <div className="py-1">
            <div className="px-5 mb-1.5">
              <span className="text-[11px] font-medium text-slate-500">기타</span>
            </div>
          <div className="space-y-0.5">
            <Link
              href="/customer-center"
              prefetch={true}
              className={cn(
                "flex items-center gap-2.5 px-5 py-1.5 text-[15px] transition-all rounded-lg",
                isLinkActive("/customer-center", true)
                  ? "bg-slate-100 text-slate-900 font-medium"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-normal",
              )}
            >
              <Headset className="h-4 w-4 flex-shrink-0" />
              <span>고객센터</span>
            </Link>
            {showAdminMenu && (
              <Link
                href="/admin"
                prefetch={true}
                className={cn(
                  "flex items-center gap-2.5 px-5 py-1.5 text-[15px] transition-all rounded-lg",
                  isLinkActive("/admin", true)
                    ? "bg-slate-100 text-slate-900 font-medium"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-normal",
                )}
              >
                <Shield className="h-4 w-4 flex-shrink-0" />
                <span>관리자</span>
              </Link>
            )}
          </div>
          </div>
        </div>
      </nav>

      {/* 하단 푸터 영역 */}
      <div className="p-4 border-t border-slate-100 bg-white">
        <div className="text-[11px] leading-relaxed text-slate-400 font-medium px-2">
          <p className="mb-1">© 2025 Seoul Founders Club</p>
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            <Link href="/terms" className="hover:text-slate-600 transition-colors">이용약관</Link>
            <span className="text-slate-300">·</span>
            <Link href="/privacy" className="hover:text-slate-600 transition-colors">개인정보처리방침</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Users, Calendar, FileText, Eye, Trash2, Medal, Briefcase } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserManagementRow } from "@/components/user-management"
import { DeleteEventButton } from "@/components/delete-event-button"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { BadgeManagementTab } from "./badge-management-tab"
import { PartnerApplicationsTab } from "./partner-applications-tab"
import { PostManagementTab } from "./posts/post-management-tab"
import { deletePost } from "@/lib/actions/posts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type TabType = "users" | "events" | "posts" | "badges" | "partner-applications"

type User = {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  membership_tier: string | null
  points: number | null
  created_at: string
}

type Event = {
  id: string
  title: string
  thumbnail_url: string | null
  event_date: string
  location: string
  created_at: string
  participantCount: number
  max_participants: number | null
  profiles: {
    id: string
    full_name: string | null
    avatar_url: string | null
  } | null
}

type Post = {
  id: string
  title: string
  created_at: string
  profiles: {
    id: string
    full_name: string | null
    avatar_url: string | null
  } | null
  board_categories: {
    id: string
    name: string
    slug: string
  } | null
}

type Badge = {
  id: string
  name: string
  icon: string
  category: string
  description: string | null
}

type PendingBadge = {
  id: string
  status: string
  evidence: string | null
  created_at: string
  profiles: {
    id: string
    full_name: string | null
    email: string | null
    avatar_url: string | null
  } | null
  badges: {
    id: string
    name: string
    icon: string
  } | null
}

type Category = {
  id: string
  name: string
  type: "insight" | "partner"
  created_at: string
}

type PartnerApplication = {
  id: string
  created_at: string
  status: "pending" | "approved" | "rejected"
  company_name: string | null
  current_usage: string | null
  profiles: {
    id: string
    full_name: string | null
    email: string | null
  } | null
  partners?: {
    id: string
    name: string
  } | null
  partner_name?: string | null
}

type BadgeCategory = {
  category_value: string
  category_label: string
  sort_order: number
}

type AdminViewProps = {
  users: User[]
  events: Event[]
  posts: Post[]
  badges: Badge[]
  pendingBadges: PendingBadge[]
  categories?: Category[]
  partnerApplications?: PartnerApplication[]
  badgeCategories?: BadgeCategory[]
  currentUserId: string
  isMaster: boolean
}

export function AdminView({ users, events, posts, badges, pendingBadges, categories = [], partnerApplications = [], badgeCategories = [], currentUserId, isMaster }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("users")
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // 메트릭 카드 컴포넌트
  const MetricCard = ({
    tab,
    label,
    count,
    icon: Icon,
  }: {
    tab: TabType
    label: string
    count: number
    icon: any
  }) => (
    <div
      onClick={() => setActiveTab(tab)}
      className={cn(
        "relative overflow-hidden rounded-xl border p-5 cursor-pointer transition-all duration-200 hover:shadow-md",
        "bg-white border-slate-200",
        activeTab === tab
          ? "ring-2 ring-slate-900 border-transparent shadow-md"
          : "hover:shadow-md"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-slate-500">{label}</h3>
        <div
          className={cn(
            "p-2 rounded-full text-slate-400 transition-colors",
            activeTab === tab ? "bg-slate-900 text-white" : "bg-slate-50"
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-slate-900">{count}</span>
      </div>
    </div>
  )

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  const handleDeletePost = async () => {
    if (!deletingPostId) return
    
    setIsDeleting(true)
    try {
      await deletePost(deletingPostId)
      setShowDeleteDialog(false)
      setDeletingPostId(null)
      window.location.reload() // 페이지 새로고침으로 목록 갱신
    } catch (error) {
      console.error("Failed to delete post:", error)
      alert("게시글 삭제에 실패했습니다.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">관리자 대시보드</h1>
        <p className="mt-2 text-slate-600">Seoul Founders Club 커뮤니티 관리</p>
      </div>

        {/* 메트릭 카드 (탭 버튼) */}
        <div className="mb-8 grid gap-4 md:grid-cols-5">
          <MetricCard tab="users" label="전체 회원" count={users.length} icon={Users} />
          <MetricCard tab="events" label="전체 이벤트" count={events.length} icon={Calendar} />
          <MetricCard tab="posts" label="게시판 관리" count={posts.length} icon={FileText} />
          <MetricCard tab="badges" label="뱃지 관리" count={badges.length} icon={Medal} />
          <MetricCard tab="partner-applications" label="파트너스 신청" count={partnerApplications.length} icon={Briefcase} />
        </div>

        {/* 하단 콘텐츠 영역 */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          {/* 회원 탭 */}
          {activeTab === "users" && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-6">회원 목록</h2>
              {users.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>프로필</TableHead>
                      <TableHead>이메일</TableHead>
                      <TableHead>등급</TableHead>
                      <TableHead>가입일</TableHead>
                      <TableHead className="text-right">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <UserManagementRow
                        key={user.id}
                        user={user}
                        currentUserId={currentUserId}
                        canChangeRole={isMaster}
                      />
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-12 text-center text-slate-500">회원이 없습니다</div>
              )}
            </div>
          )}

          {/* 이벤트 탭 */}
          {activeTab === "events" && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-6">이벤트 목록</h2>
              {events.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>썸네일</TableHead>
                      <TableHead>제목</TableHead>
                      <TableHead>일시</TableHead>
                      <TableHead>호스트</TableHead>
                      <TableHead>참여인원</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead className="text-right">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => {
                      const eventDate = new Date(event.event_date)
                      const isPast = eventDate < new Date()
                      const status = isPast ? "종료" : "예정"

                      return (
                        <TableRow key={event.id}>
                          <TableCell>
                            <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-slate-100">
                              {event.thumbnail_url ? (
                                <Image
                                  src={event.thumbnail_url}
                                  alt={event.title}
                                  width={48}
                                  height={48}
                                  className="object-cover h-full w-full"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-slate-400">
                                  <Calendar className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-slate-900">{event.title}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-slate-600">{formatDate(event.event_date)}</div>
                            <div className="text-xs text-slate-500">{event.location}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-slate-600">
                              {event.profiles?.full_name || "알 수 없음"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-slate-600">
                              {event.participantCount}
                              {event.max_participants ? ` / ${event.max_participants}` : ""}명
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                                isPast
                                  ? "bg-slate-100 text-slate-700"
                                  : "bg-green-50 text-green-700"
                              )}
                            >
                              {status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <DeleteEventButton eventId={event.id} />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-12 text-center text-slate-500">등록된 이벤트가 없습니다</div>
              )}
            </div>
          )}

          {/* 게시판 관리 탭 */}
          {activeTab === "posts" && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-6">게시판 관리</h2>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full max-w-2xl grid-cols-5 mb-6">
                  <TabsTrigger value="all">전체</TabsTrigger>
                  <TabsTrigger value="free">자유게시판</TabsTrigger>
                  <TabsTrigger value="insights">인사이트</TabsTrigger>
                  <TabsTrigger value="partners">파트너스</TabsTrigger>
                  <TabsTrigger value="announcement">공지사항</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-0">
                  <PostManagementTab
                    boardType="all"
                    initialPosts={posts}
                    initialCategories={categories}
                  />
                </TabsContent>

                <TabsContent value="free" className="mt-0">
                  <PostManagementTab
                    boardType="free"
                    initialPosts={posts.filter(p =>
                      p.board_categories?.slug === "free" || p.board_categories?.slug === "free-board"
                    )}
                    initialCategories={categories}
                  />
                </TabsContent>

                <TabsContent value="insights" className="mt-0">
                  <PostManagementTab
                    boardType="insights"
                    initialPosts={posts.filter(p => p.board_categories?.slug === "insights")}
                    initialCategories={categories.filter(c => c.type === "insight")}
                  />
                </TabsContent>

                <TabsContent value="partners" className="mt-0">
                  <PostManagementTab
                    boardType="partners"
                    initialPosts={posts.filter(p => p.board_categories?.slug === "partners")}
                    initialCategories={categories.filter(c => c.type === "partner")}
                  />
                </TabsContent>

                <TabsContent value="announcement" className="mt-0">
                  <PostManagementTab
                    boardType="announcement"
                    initialPosts={posts.filter(p =>
                      p.board_categories?.slug === "announcement" ||
                      p.board_categories?.slug === "announcements"
                    )}
                    initialCategories={categories}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* 뱃지 관리 탭 */}
          {activeTab === "badges" && (
            <BadgeManagementTab 
              badges={badges} 
              pendingBadges={pendingBadges}
              badgeCategories={badgeCategories}
            />
          )}

          {/* 파트너스 신청 관리 탭 */}
          {activeTab === "partner-applications" && (
            <PartnerApplicationsTab 
              applications={partnerApplications}
            />
          )}
        </div>
      </div>

      {/* 게시글 삭제 확인 다이얼로그 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white z-[100]">
          <AlertDialogHeader>
            <AlertDialogTitle>게시글을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 취소할 수 없습니다. 게시글과 모든 댓글이 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePost} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}


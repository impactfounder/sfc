"use client"

import { useState } from "react"
import { Users, Calendar, FileText } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserManagementRow } from "@/components/user-management"
import { DeleteEventButton } from "@/components/delete-event-button"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Eye, Trash2 } from "lucide-react"

type TabType = "users" | "events" | "posts"

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

type AdminViewProps = {
  users: User[]
  events: Event[]
  posts: Post[]
  currentUserId: string
  isMaster: boolean
}

export function AdminView({ users, events, posts, currentUserId, isMaster }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("users")

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

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 pt-20 md:pt-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">관리자 대시보드</h1>
          <p className="mt-2 text-slate-600">Seoul Founders Club 커뮤니티 관리</p>
        </div>

        {/* 메트릭 카드 (탭 버튼) */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <MetricCard tab="users" label="전체 회원" count={users.length} icon={Users} />
          <MetricCard tab="events" label="전체 이벤트" count={events.length} icon={Calendar} />
          <MetricCard tab="posts" label="전체 게시글" count={posts.length} icon={FileText} />
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
                      <TableHead>포인트</TableHead>
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

          {/* 게시글 탭 */}
          {activeTab === "posts" && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-6">게시글 목록</h2>
              {posts.length > 0 ? (
                <div className="space-y-3">
                  {posts.map((post) => {
                    const boardSlug = post.board_categories?.slug || "free"
                    const postUrl = `/community/board/${boardSlug}/${post.id}`

                    return (
                      <div
                        key={post.id}
                        className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-slate-900 truncate">{post.title}</h3>
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-xs font-medium text-slate-600 whitespace-nowrap">
                              {post.board_categories?.name || "게시판"}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span>작성자: {post.profiles?.full_name || "익명"}</span>
                            <span>작성일: {formatShortDate(post.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Link href={postUrl}>
                            <Button variant="outline" size="sm" className="gap-2">
                              <Eye className="h-4 w-4" />
                              보기
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500">등록된 게시글이 없습니다</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


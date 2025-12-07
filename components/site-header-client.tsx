"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    Bell,
    Plus,
    Settings,
    LogOut,
    User,
    PenSquare,
    Calendar,
    Users,
    Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"

interface SiteHeaderClientProps {
    user: any
    profile: any
}

export function SiteHeaderClient({ user, profile }: SiteHeaderClientProps) {
    const router = useRouter()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.refresh()
        window.location.href = "/" // 강제 리디렉션
    }

    return (
        <div className="flex flex-1 items-center justify-between gap-4">
            {/* Center: Search (Placeholder for now) */}
            <div className="flex-1 max-w-xl px-4 hidden md:block">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="서울 파운더스 클럽 검색"
                        className="w-full bg-slate-100 border-none pl-9 h-9 rounded-full focus-visible:ring-slate-400 focus-visible:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                {user ? (
                    <>
                        {/* 만들기 버튼 (Dropdown) */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="hidden md:flex gap-1.5 h-9 rounded-full px-3 hover:bg-slate-100">
                                    <Plus className="h-5 w-5" />
                                    <span className="font-medium">만들기</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => router.push("/community/new")}>
                                    <PenSquare className="mr-2 h-4 w-4" />
                                    <span>새 글 쓰기</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push("/e/new")}>
                                    <Calendar className="mr-2 h-4 w-4" />
                                    <span>새 이벤트</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push("/communities/new")}>
                                    <Users className="mr-2 h-4 w-4" />
                                    <span>새 커뮤니티</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* 모바일용 만들기 아이콘 */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 rounded-full">
                                    <Plus className="h-6 w-6" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push("/community/new")}>
                                    새 글 쓰기
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push("/e/new")}>
                                    새 이벤트
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push("/communities/new")}>
                                    새 커뮤니티
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* 알림 */}
                        <NotificationsDropdown
                            triggerClassName="h-9 w-9 rounded-full"
                            align="end"
                        />

                        {/* 프로필 드롭다운 */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 ml-1 border border-slate-200 overflow-hidden">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || ""} />
                                        <AvatarFallback className="bg-slate-100 text-slate-600 font-medium">
                                            {profile?.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{profile?.full_name || "사용자"}</p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {user.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => router.push("/community/profile")}>
                                    <User className="mr-2 h-4 w-4" />
                                    <span>내 프로필</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push("/settings")}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>설정</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={handleSignOut}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>로그아웃</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </>
                ) : (
                    <div className="flex items-center gap-2">
                        <Link href="/auth/login">
                            <Button variant="ghost" className="rounded-full">로그인</Button>
                        </Link>
                        <Link href="/auth/login">
                            <Button className="rounded-full">가입하기</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}

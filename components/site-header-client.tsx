"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import {
    Bell,
    Plus,
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
import { createClient, resetClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"

interface SiteHeaderClientProps {
    user: any
    profile: any
    initialNotifications?: any[]
}

export function SiteHeaderClient({ user, profile, initialNotifications = [] }: SiteHeaderClientProps) {
    const router = useRouter()
    const supabase = createClient()
    const [activeCreateItem, setActiveCreateItem] = useState<"post" | "event" | "community" | null>(null)
    const [activeProfileItem, setActiveProfileItem] = useState<"profile" | "logout" | null>(null)

    const handleSignOut = () => {
        // 1. 쿠키 삭제
        document.cookie.split(";").forEach((c) => {
            document.cookie = c
                .replace(/^ +/, "")
                .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
        })

        // 2. localStorage 클리어
        localStorage.clear()

        // 3. Supabase 클라이언트 인스턴스 초기화 (싱글톤 리셋)
        resetClient()

        // 4. 리디렉션
        window.location.href = "/"
    }

    return (
        <div className="flex flex-1 items-center justify-end gap-4">

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
                            <DropdownMenuContent
                                align="end"
                                sideOffset={10}
                                className="z-[70] w-52 bg-white shadow-lg border border-slate-200"
                                onMouseLeave={() => setActiveCreateItem(null)}
                            >
                                <DropdownMenuItem
                                    onClick={() => router.push("/community/new")}
                                    onMouseEnter={() => setActiveCreateItem("post")}
                                    className={activeCreateItem === "post" ? "bg-slate-100 text-slate-900 font-semibold" : "text-slate-600"}
                                >
                                    <PenSquare className={`mr-2 h-4 w-4 ${activeCreateItem === "post" ? "text-slate-900" : "text-slate-500"}`} />
                                    <span>새 글 쓰기</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => router.push("/e/new")}
                                    onMouseEnter={() => setActiveCreateItem("event")}
                                    className={activeCreateItem === "event" ? "bg-slate-100 text-slate-900 font-semibold" : "text-slate-600"}
                                >
                                    <Calendar className={`mr-2 h-4 w-4 ${activeCreateItem === "event" ? "text-slate-900" : "text-slate-500"}`} />
                                    <span>새 이벤트</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => router.push("/communities/new")}
                                    onMouseEnter={() => setActiveCreateItem("community")}
                                    className={activeCreateItem === "community" ? "bg-slate-100 text-slate-900 font-semibold" : "text-slate-600"}
                                >
                                    <Users className={`mr-2 h-4 w-4 ${activeCreateItem === "community" ? "text-slate-900" : "text-slate-500"}`} />
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
                            <DropdownMenuContent
                                align="end"
                                sideOffset={10}
                                className="z-[70] bg-white shadow-lg border border-slate-200"
                            >
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
                            initialUser={user}
                            initialNotifications={initialNotifications}
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
                            <DropdownMenuContent
                                className="w-56 z-[70] bg-white shadow-lg border border-slate-200"
                                align="end"
                                sideOffset={10}
                                forceMount
                                onMouseLeave={() => setActiveProfileItem(null)}
                            >
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{profile?.full_name || "사용자"}</p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {user.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => router.push("/community/profile")}
                                    onMouseEnter={() => setActiveProfileItem("profile")}
                                    className={activeProfileItem === "profile" ? "bg-slate-100 text-slate-900 font-semibold" : "text-slate-600"}
                                >
                                    <User className={`mr-2 h-4 w-4 ${activeProfileItem === "profile" ? "text-slate-900" : "text-slate-500"}`} />
                                    <span>내 프로필</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className={`text-red-600 ${activeProfileItem === "logout" ? "bg-red-50 font-semibold" : ""}`}
                                    onClick={handleSignOut}
                                    onMouseEnter={() => setActiveProfileItem("logout")}
                                >
                                    <LogOut className={`mr-2 h-4 w-4 ${activeProfileItem === "logout" ? "text-red-600" : "text-slate-500"}`} />
                                    <span>로그아웃</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </>
                ) : (
                    <div className="flex items-center gap-2">
                        <Link href="/auth/login">
                            <Button
                                variant="ghost"
                                className="rounded-full hover:bg-slate-100 hover:text-slate-900"
                            >
                                로그인
                            </Button>
                        </Link>
                        <Link href="/auth/login">
                            <Button className="rounded-full hover:bg-slate-100 hover:text-slate-900 transition-colors">
                                가입하기
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}

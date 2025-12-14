"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
    Bell,
    Plus,
    Settings,
    LogOut,
    User,
    PenSquare,
    Calendar,
    Users,
    Search,
    Menu
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
    const [activeCreateItem, setActiveCreateItem] = useState<"post" | "event" | "community" | null>(null)
    const [activeProfileItem, setActiveProfileItem] = useState<"profile" | "settings" | "logout" | null>(null)

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.refresh()
        window.location.href = "/" // 강제 리디렉션
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
                        />

                        {/* 프로필 드롭다운 - 데스크탑만 */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative hidden md:flex h-9 w-9 rounded-full p-0 ml-1 border border-slate-200 overflow-hidden">
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
                                <DropdownMenuItem
                                    onClick={() => router.push("/settings")}
                                    onMouseEnter={() => setActiveProfileItem("settings")}
                                    className={activeProfileItem === "settings" ? "bg-slate-100 text-slate-900 font-semibold" : "text-slate-600"}
                                >
                                    <Settings className={`mr-2 h-4 w-4 ${activeProfileItem === "settings" ? "text-slate-900" : "text-slate-500"}`} />
                                    <span>설정</span>
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

                        {/* 햄버거 메뉴 - 모바일만 */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 rounded-full">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-56 z-[70] bg-white shadow-lg border border-slate-200"
                                align="end"
                                sideOffset={10}
                            >
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || ""} />
                                            <AvatarFallback className="bg-slate-100 text-slate-600 font-medium text-sm">
                                                {profile?.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <p className="text-sm font-medium leading-none">{profile?.full_name || "사용자"}</p>
                                            <p className="text-xs leading-none text-muted-foreground mt-1">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => router.push("/settings")}>
                                    <Settings className="mr-2 h-4 w-4 text-slate-500" />
                                    <span>설정</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={handleSignOut}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>로그아웃</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </>
                ) : (
                    <>
                        {/* 데스크탑: 로그인/가입하기 버튼 */}
                        <div className="hidden md:flex items-center gap-2">
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

                        {/* 모바일: 햄버거 메뉴 */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 rounded-full">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-48 z-[70] bg-white shadow-lg border border-slate-200"
                                align="end"
                                sideOffset={10}
                            >
                                <DropdownMenuItem onClick={() => router.push("/auth/login")}>
                                    <User className="mr-2 h-4 w-4 text-slate-500" />
                                    <span>로그인</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push("/auth/login")}>
                                    <span className="ml-6">가입하기</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </>
                )}
            </div>
        </div>
    )
}

"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect } from "react"
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
    Menu,
    BookOpen,
    Zap,
    Briefcase,
    Megaphone,
    MessageSquare,
    Ticket,
    Lightbulb,
    Headset,
    Shield,
    Home
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

// 사이드바와 동일한 메뉴 구조
const navigationSections = [
    {
        title: "소개",
        links: [
            { name: "SEOUL FOUNDERS CLUB", href: "/about", icon: BookOpen },
            { name: "멤버", href: "/member", icon: Users }
        ]
    },
    {
        title: "성장",
        links: [
            { name: "이벤트", href: "/e", icon: Calendar },
            { name: "인사이트", href: "/community/board/insights", icon: Zap },
            { name: "파트너스", href: "/partners", icon: Briefcase }
        ]
    },
    {
        title: "게시판",
        links: [
            { name: "공지사항", href: "/community/board/announcements", icon: Megaphone },
            { name: "자유게시판", href: "/community/board/free", icon: MessageSquare }
        ]
    },
    {
        title: "커뮤니티",
        links: [
            { name: "커뮤니티 홈", href: "/community", icon: Ticket },
            { name: "반골", href: "/community/board/vangol", icon: Users },
            { name: "하이토크", href: "/community/board/hightalk", icon: Lightbulb }
        ]
    },
]

interface SiteHeaderClientProps {
    user: any
    profile: any
}

export function SiteHeaderClient({ user, profile }: SiteHeaderClientProps) {
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()
    const [activeCreateItem, setActiveCreateItem] = useState<"post" | "event" | "community" | null>(null)
    const [activeProfileItem, setActiveProfileItem] = useState<"profile" | "settings" | "logout" | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    // 관리자 여부 확인
    const isAdmin = profile?.role === "admin" || profile?.role === "master"

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const handleSignOut = async () => {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) {
                console.error('로그아웃 오류:', error)
            }
            // 로그아웃 성공/실패 여부와 상관없이 홈으로 리다이렉트
            window.location.href = "/"
        } catch (err) {
            console.error('로그아웃 예외:', err)
            window.location.href = "/"
        }
    }

    const isLinkActive = (href: string) => {
        if (href === '/community') return pathname === href
        return pathname.startsWith(href)
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
                                    className={`text-red-600 ${activeProfileItem === "logout" ? "bg-red-50 font-semibold" : ""} cursor-pointer`}
                                    onClick={() => handleSignOut()}
                                    onMouseEnter={() => setActiveProfileItem("logout")}
                                >
                                    <LogOut className={`mr-2 h-4 w-4 ${activeProfileItem === "logout" ? "text-red-600" : "text-slate-500"}`} />
                                    <span>로그아웃</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* 햄버거 메뉴 - 모바일 사이드바 */}
                        {isMounted ? (
                            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 rounded-full">
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0 bg-white border-l border-slate-200">
                                    <SheetHeader className="p-6 border-b border-slate-100 text-left">
                                        <SheetTitle className="text-lg font-bold text-slate-900">메뉴</SheetTitle>
                                    </SheetHeader>

                                    <div className="flex flex-col h-full overflow-y-auto py-4 pb-20">
                                        {/* 홈 */}
                                        <div className="mb-4 px-4">
                                            <Link
                                                href="/"
                                                onClick={() => setIsSheetOpen(false)}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-2.5 text-[15px] transition-all rounded-xl",
                                                    pathname === "/"
                                                        ? "bg-slate-100 text-slate-900 font-bold"
                                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                                                )}
                                            >
                                                <Home className="h-5 w-5 flex-shrink-0" />
                                                <span>홈</span>
                                            </Link>
                                        </div>

                                        {/* 네비게이션 섹션 */}
                                        {navigationSections.map((section) => (
                                            <div key={section.title} className="mb-6 px-4">
                                                <h4 className="mb-2 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                    {section.title}
                                                </h4>
                                                <div className="space-y-1">
                                                    {section.links.map((item) => {
                                                        const Icon = item.icon
                                                        const active = isLinkActive(item.href)

                                                        return (
                                                            <Link
                                                                key={item.name}
                                                                href={item.href}
                                                                onClick={() => setIsSheetOpen(false)}
                                                                className={cn(
                                                                    "flex items-center gap-3 px-3 py-2.5 text-[15px] transition-all rounded-xl",
                                                                    active
                                                                        ? "bg-slate-100 text-slate-900 font-bold"
                                                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                                                                )}
                                                            >
                                                                <Icon className={cn("h-5 w-5 flex-shrink-0", active ? "text-slate-900" : "text-slate-400")} />
                                                                <span>{item.name}</span>
                                                            </Link>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))}

                                        {/* 기타 섹션 */}
                                        <div className="mb-6 px-4">
                                            <h4 className="mb-2 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                기타
                                            </h4>
                                            <div className="space-y-1">
                                                <Link
                                                    href="/customer-center"
                                                    onClick={() => setIsSheetOpen(false)}
                                                    className={cn(
                                                        "flex items-center gap-3 px-3 py-2.5 text-[15px] transition-all rounded-xl",
                                                        isLinkActive("/customer-center")
                                                            ? "bg-slate-100 text-slate-900 font-bold"
                                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                                                    )}
                                                >
                                                    <Headset className="h-5 w-5 flex-shrink-0 text-slate-400" />
                                                    <span>고객센터</span>
                                                </Link>

                                                {/* 관리자 메뉴 */}
                                                {isAdmin && (
                                                    <Link
                                                        href="/admin"
                                                        onClick={() => setIsSheetOpen(false)}
                                                        className={cn(
                                                            "flex items-center gap-3 px-3 py-2.5 text-[15px] transition-all rounded-xl",
                                                            isLinkActive("/admin")
                                                                ? "bg-slate-100 text-slate-900 font-bold"
                                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                                                        )}
                                                    >
                                                        <Shield className="h-5 w-5 flex-shrink-0 text-slate-400" />
                                                        <span>관리자</span>
                                                    </Link>
                                                )}

                                                <Link
                                                    href="/settings"
                                                    onClick={() => setIsSheetOpen(false)}
                                                    className={cn(
                                                        "flex items-center gap-3 px-3 py-2.5 text-[15px] transition-all rounded-xl",
                                                        isLinkActive("/settings")
                                                            ? "bg-slate-100 text-slate-900 font-bold"
                                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                                                    )}
                                                >
                                                    <Settings className="h-5 w-5 flex-shrink-0 text-slate-400" />
                                                    <span>설정</span>
                                                </Link>
                                            </div>
                                        </div>

                                        {/* 로그아웃 */}
                                        <div className="px-4 mt-auto">
                                            <button
                                                onClick={() => {
                                                    setIsSheetOpen(false)
                                                    handleSignOut()
                                                }}
                                                className="flex items-center gap-3 px-3 py-2.5 text-[15px] transition-all rounded-xl text-red-600 hover:bg-red-50 font-medium w-full"
                                            >
                                                <LogOut className="h-5 w-5 flex-shrink-0" />
                                                <span>로그아웃</span>
                                            </button>
                                        </div>

                                        {/* 하단 여백 */}
                                        <div className="h-12" />
                                    </div>
                                </SheetContent>
                            </Sheet>
                        ) : (
                            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 rounded-full">
                                <Menu className="h-5 w-5" />
                            </Button>
                        )}
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

                        {/* 모바일: 햄버거 메뉴 - 사이드바 */}
                        {isMounted ? (
                            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 rounded-full">
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0 bg-white border-l border-slate-200">
                                    <SheetHeader className="p-6 border-b border-slate-100 text-left">
                                        <SheetTitle className="text-lg font-bold text-slate-900">메뉴</SheetTitle>
                                    </SheetHeader>

                                    <div className="flex flex-col h-full overflow-y-auto py-4 pb-20">
                                        {/* 홈 */}
                                        <div className="mb-4 px-4">
                                            <Link
                                                href="/"
                                                onClick={() => setIsSheetOpen(false)}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-2.5 text-[15px] transition-all rounded-xl",
                                                    pathname === "/"
                                                        ? "bg-slate-100 text-slate-900 font-bold"
                                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                                                )}
                                            >
                                                <Home className="h-5 w-5 flex-shrink-0" />
                                                <span>홈</span>
                                            </Link>
                                        </div>

                                        {/* 네비게이션 섹션 */}
                                        {navigationSections.map((section) => (
                                            <div key={section.title} className="mb-6 px-4">
                                                <h4 className="mb-2 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                    {section.title}
                                                </h4>
                                                <div className="space-y-1">
                                                    {section.links.map((item) => {
                                                        const Icon = item.icon
                                                        const active = isLinkActive(item.href)

                                                        return (
                                                            <Link
                                                                key={item.name}
                                                                href={item.href}
                                                                onClick={() => setIsSheetOpen(false)}
                                                                className={cn(
                                                                    "flex items-center gap-3 px-3 py-2.5 text-[15px] transition-all rounded-xl",
                                                                    active
                                                                        ? "bg-slate-100 text-slate-900 font-bold"
                                                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                                                                )}
                                                            >
                                                                <Icon className={cn("h-5 w-5 flex-shrink-0", active ? "text-slate-900" : "text-slate-400")} />
                                                                <span>{item.name}</span>
                                                            </Link>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))}

                                        {/* 기타 섹션 */}
                                        <div className="mb-6 px-4">
                                            <h4 className="mb-2 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                기타
                                            </h4>
                                            <div className="space-y-1">
                                                <Link
                                                    href="/customer-center"
                                                    onClick={() => setIsSheetOpen(false)}
                                                    className="flex items-center gap-3 px-3 py-2.5 text-[15px] transition-all rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                                                >
                                                    <Headset className="h-5 w-5 flex-shrink-0 text-slate-400" />
                                                    <span>고객센터</span>
                                                </Link>
                                            </div>
                                        </div>

                                        {/* 로그인 버튼 */}
                                        <div className="px-4 mt-auto">
                                            <Link
                                                href="/auth/login"
                                                onClick={() => setIsSheetOpen(false)}
                                                className="flex items-center justify-center gap-2 px-4 py-3 text-[15px] font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
                                            >
                                                <User className="h-5 w-5" />
                                                <span>로그인 / 가입하기</span>
                                            </Link>
                                        </div>

                                        {/* 하단 여백 */}
                                        <div className="h-12" />
                                    </div>
                                </SheetContent>
                            </Sheet>
                        ) : (
                            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 rounded-full">
                                <Menu className="h-5 w-5" />
                            </Button>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

import Link from "next/link"
import Image from "next/image"
import { getCachedUserProfile } from "@/lib/queries/cached"
import { SiteHeaderClient } from "./site-header-client"

interface SiteHeaderProps {
    user?: any
    profile?: any
}

export async function SiteHeader({ user, profile }: SiteHeaderProps = {}) {
    // props가 없을 때만 조회 (캐시된 함수 사용으로 중복 호출 방지)
    if (user === undefined && profile === undefined) {
        const userProfile = await getCachedUserProfile()
        user = userProfile?.user || null
        profile = userProfile?.profile || null
    }

    return (
        <header className="fixed inset-x-0 top-0 z-50 h-16 w-full border-b border-slate-200/50 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75 shadow-sm shadow-slate-900/5">
            <div className="flex h-16 w-full items-center px-4 lg:px-[27px]">
                {/* Left: Logo - 사이드바 너비(240px)에 맞춰 중앙 정렬 */}
                <div className="w-[240px] flex items-center justify-center flex-shrink-0">
                    <Link href="/" className="flex items-center hover:opacity-85 transition-opacity">
                        <Image
                            src="/images/logo-text.png"
                            alt="Seoul Founders Club"
                            width={580}
                            height={51}
                            className="h-6 w-auto max-w-44 object-contain"
                            priority
                        />
                    </Link>
                </div>

                {/* Client Side Content (Search, Actions, Profile) */}
                <SiteHeaderClient user={user} profile={profile} initialNotifications={[]} />
            </div>
        </header>
    )
}

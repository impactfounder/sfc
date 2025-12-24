import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "@/lib/queries/profiles"
import { SiteHeaderClient } from "./site-header-client"

export async function SiteHeader() {
    const supabase = await createClient()
    const userProfile = await getCurrentUserProfile(supabase)

    const user = userProfile?.user || null
    const profile = userProfile?.profile || null

    // 서버에서 알림 데이터 미리 가져오기
    let initialNotifications: any[] = []
    if (user) {
        const { data, error } = await supabase
            .from("notifications")
            .select(`
                *,
                profiles:actor_id(full_name, avatar_url)
            `)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10)

        initialNotifications = data || []
    }

    return (
        <header className="fixed inset-x-0 top-0 z-50 h-16 w-full border-b border-slate-200/50 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75 shadow-sm shadow-slate-900/5">
            <div className="flex h-16 w-full items-center px-4 lg:px-[27px]">
                {/* Left: Logo */}
                <div className="ml-1 mr-4 flex items-center">
                    <Link href="/" className="flex items-center hover:opacity-85 transition-opacity">
                        <Image
                            src="/images/logo-text.png"
                            alt="Seoul Founders Club"
                            width={580}
                            height={51}
                            className="h-8 w-auto max-w-56 object-contain"
                            priority
                        />
                    </Link>
                </div>

                {/* Client Side Content (Search, Actions, Profile) */}
                <SiteHeaderClient user={user} profile={profile} initialNotifications={initialNotifications} />
            </div>
        </header>
    )
}

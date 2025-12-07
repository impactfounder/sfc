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

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white h-14">
            <div className="flex h-14 items-center px-4">
                {/* Left: Logo */}
                <div className="mr-4 flex items-center">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <Image
                            src="/images/logo.png"
                            alt="SFC"
                            width={32}
                            height={32}
                            className="h-8 w-8 object-contain"
                        />
                        <span className="hidden lg:inline-block font-bold text-xl tracking-tight text-slate-900">
                            SFC
                        </span>
                    </Link>
                </div>

                {/* Client Side Content (Search, Actions, Profile) */}
                <SiteHeaderClient user={user} profile={profile} />
            </div>
        </header>
    )
}

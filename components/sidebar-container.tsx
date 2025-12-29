import { getCachedUserProfile } from "@/lib/queries/cached"
import { Sidebar } from "@/components/sidebar"

export async function SidebarContainer() {
    const userProfile = await getCachedUserProfile()
    const role = userProfile?.profile?.role

    return <Sidebar userRole={role} />
}

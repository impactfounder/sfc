import { createClient } from "@/lib/supabase/server"
import { getCurrentUserProfile } from "@/lib/queries/profiles"
import { SidebarProfileClient } from "./sidebar-profile-client"

export default async function SidebarProfile() {
  const supabase = await createClient()
  const userProfile = await getCurrentUserProfile(supabase)

  // 데이터만 클라이언트 컴포넌트로 전달
  return (
    <SidebarProfileClient 
      user={userProfile?.user || null} 
      profile={userProfile?.profile || null} 
    />
  )
}


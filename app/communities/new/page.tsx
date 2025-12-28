import { requireAuth } from "@/lib/auth/server"
import { NewCommunityForm } from "@/components/new-community-form"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"

export default async function NewCommunityPage() {
  const { user } = await requireAuth()
  const userId = user.id

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* 메인 콘텐츠 (좌측) */}
      <div className="lg:col-span-9">
        <NewCommunityForm userId={userId} />
      </div>

      {/* 사이드바 (우측) */}
      <div className="hidden lg:block lg:col-span-3">
        <div className="sticky top-24">
          <StandardRightSidebar />
        </div>
      </div>
    </div>
  )
}

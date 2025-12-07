import { requireAuth } from "@/lib/auth/server"
import { NewCommunityForm } from "@/components/new-community-form"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"

export default async function NewCommunityPage() {
  const { user } = await requireAuth()
  const userId = user.id

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
      <div className="lg:col-span-9">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">새 커뮤니티 만들기</h1>
          <p className="mt-1 text-sm text-slate-600">관심사가 같은 멤버들과 함께하는 커뮤니티를 개설하세요</p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
          <NewCommunityForm userId={userId} />
        </div>
      </div>

      <div className="hidden lg:block lg:col-span-3">
        <div className="sticky top-8">
          <StandardRightSidebar />
        </div>
      </div>
    </div>
  )
}

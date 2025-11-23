import { requireAuth } from "@/lib/auth/server"
import { NewCommunityForm } from "@/components/new-community-form"

export default async function NewCommunityPage() {
  const { user } = await requireAuth()
  const userId = user.id

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 pt-20 md:pt-12 lg:pl-[344px]">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">새 소모임 만들기</h1>
          <p className="mt-2 text-base text-slate-600">관심사가 같은 멤버들과 함께하는 소모임을 개설하세요</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-200 sm:p-10">
          <NewCommunityForm userId={userId} />
        </div>
      </div>
    </div>
  )
}


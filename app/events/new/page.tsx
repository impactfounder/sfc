import { requireAuth } from "@/lib/auth/server"
import { NewEventForm } from "@/components/new-event-form"

export default async function NewEventPage() {
  const { user } = await requireAuth()
  const userId = user.id

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 pt-20 md:pt-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">새 이벤트 만들기</h1>
          <p className="mt-2 text-base text-slate-600">모임, 워크샵, 네트워킹 이벤트를 개최하세요</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-200 sm:p-10">
          <NewEventForm userId={userId} />
        </div>
      </div>
    </div>
  )
}


import { requireAuth } from "@/lib/auth/server"
import { NewEventForm } from "@/components/new-event-form"

export default async function NewEventPage() {
  const { user } = await requireAuth()
  const userId = user.id

  return (
    <div className="min-h-screen bg-slate-50 py-4 sm:py-10">
      <div className="mx-auto max-w-7xl px-0 sm:px-4 lg:px-8">
        <div className="mb-6 px-4 sm:mb-10 sm:px-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">새 이벤트 만들기</h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">모임, 워크샵, 네트워킹 이벤트를 개최하세요</p>
        </div>

        <div className="rounded-none bg-white p-4 shadow-sm sm:rounded-2xl sm:p-8 sm:border sm:border-slate-200 lg:p-10">
          <NewEventForm userId={userId} />
        </div>
      </div>
    </div>
  )
}


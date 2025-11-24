import { redirect } from "next/navigation"

import { FreeBoardWriteForm } from "@/components/free-board-write-form"
import { createClient } from "@/lib/supabase/server"

export default async function FreeBoardWritePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Free Board</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">자유게시판 글쓰기</h1>
          <p className="mt-2 text-base text-slate-600">
            자유롭게 아이디어와 경험을 나누고 커뮤니티와 소통해보세요.
          </p>
        </div>
        <FreeBoardWriteForm />
      </div>
    </div>
  )
}







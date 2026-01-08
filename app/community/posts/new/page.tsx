import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { NewPostForm } from "@/components/new-post-form"

export default async function NewPostPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login?next=/community/posts/new")
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-8">
        새 글 작성
      </h1>
      <NewPostForm userId={user.id} />
    </div>
  )
}

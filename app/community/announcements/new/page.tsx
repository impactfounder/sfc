import { createClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import { NewAnnouncementForm } from "@/components/new-announcement-form";

export default async function NewAnnouncementPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            공지사항 작성
          </h1>
          <p className="mt-2 text-slate-600">
            커뮤니티에 중요한 공지를 전달하세요
          </p>
        </div>

        <NewAnnouncementForm />
      </div>
    </div>
  );
}

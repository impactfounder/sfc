import { createClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import { NewProjectForm } from "@/components/new-project-form";

export default async function NewProjectPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          새 프로젝트 만들기
        </h1>
        <p className="mt-2 text-base text-slate-600">
          함께 협업할 프로젝트를 등록하고 팀원을 모집하세요
        </p>
      </div>
      
      <div className="rounded-2xl bg-white p-8 shadow-sm border border-slate-200 sm:p-10">
        <NewProjectForm userId={user.id} />
      </div>
    </div>
  );
}

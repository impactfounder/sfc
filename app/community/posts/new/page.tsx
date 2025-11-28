import { createClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import { NewPostForm } from "@/components/new-post-form";
import { StandardRightSidebar } from "@/components/standard-right-sidebar";

export default async function NewPostPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login?next=/community/posts/new");
  }

  return (
    <div className="w-full flex flex-col lg:flex-row gap-10">
      {/* [LEFT] 메인 콘텐츠 */}
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
            새 글 작성
          </h1>
          <p className="text-slate-500 text-sm mb-8">
            커뮤니티에 멤버님의 생각을 공유해주세요
          </p>
          <NewPostForm userId={user.id} />
        </div>
      </div>

      {/* [RIGHT] 우측 사이드바 */}
      <div className="hidden lg:flex w-72 shrink-0 flex-col gap-6">
        <div className="sticky top-8 flex flex-col gap-6 h-fit">
          <StandardRightSidebar />
        </div>
      </div>
    </div>
  );
}

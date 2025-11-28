import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewPostForm } from "@/components/new-post-form";
import { StandardRightSidebar } from "@/components/standard-right-sidebar";

export default async function NewBoardPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Verify board category exists
  const { data: category } = await supabase
    .from("board_categories")
    .select("id, name, slug")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!category) {
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // 현재 페이지 경로를 next 파라미터로 전달
    redirect(`/auth/login?next=/community/board/${slug}/new`);
  }

  return (
    <div className="w-full flex flex-col lg:flex-row gap-10">
      {/* [LEFT] 메인 콘텐츠 (글쓰기 폼) */}
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">
            새 글 작성 - {category.name}
          </h1>
          <NewPostForm slug={slug} boardCategoryId={category.id} />
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

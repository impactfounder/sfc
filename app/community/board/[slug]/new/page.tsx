import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!category) {
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  async function createPost(formData: FormData) {
    "use server";
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      redirect("/auth/login");
    }

    const title = formData.get("title") as string;
    const content = formData.get("content") as string;

    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        title,
        content,
        category: slug,
        author_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating post:", error);
      throw error;
    }

    redirect(`/community/board/${slug}/${post.id}`);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-2xl">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-2xl">새 글 작성 - {category.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createPost} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium text-slate-900">
                  제목
                </label>
                <Input
                  id="title"
                  name="title"
                  required
                  placeholder="제목을 입력하세요"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="content" className="text-sm font-medium text-slate-900">
                  내용
                </label>
                <Textarea
                  id="content"
                  name="content"
                  required
                  placeholder="내용을 입력하세요"
                  className="min-h-[300px] w-full"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  작성하기
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.history.back()}
                >
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewPostForm } from "@/components/new-post-form";

export default async function NewEventRequestPage() {
  const supabase = await createClient();
  const slug = 'event-requests'; // 하드코딩된 slug

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
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-2xl">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-2xl">새 글 작성 - {category.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <NewPostForm slug={slug} boardCategoryId={category.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, MessageSquare, ThumbsUp } from 'lucide-react';

export default async function BoardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const [categoryResult, userResult, postsResult] = await Promise.all([
    supabase
      .from("board_categories")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single(),
    supabase.auth.getUser(),
    supabase
      .from("posts")
      .select(`
        *,
        profiles:author_id (
          id,
          full_name
        )
      `)
      .eq("category", slug === "announcements" ? "announcement" : slug)
      .order("created_at", { ascending: false })
  ]);

  const category = categoryResult.data;
  const user = userResult.data.user;
  const posts = postsResult.data;

  if (!category && slug !== "announcements") {
    notFound();
  }

  const displayName = slug === "announcements" ? "공지사항" : category?.name;
  const displayDescription = slug === "announcements" ? "중요한 공지사항을 확인하세요" : category?.description;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {displayName}
            </h1>
            {displayDescription && (
              <p className="mt-2 text-slate-600">{displayDescription}</p>
            )}
          </div>
          {user && slug !== "announcements" && (
            <Link href={`/community/board/${slug}/new`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                글쓰기
              </Button>
            </Link>
          )}
        </div>

        <div className="space-y-2.5">
          {posts && posts.length > 0 ? (
            posts.map((post) => (
              <Link key={post.id} href={`/community/board/${slug}/${post.id}`} className="block">
                <Card className="border border-slate-200 bg-white transition-shadow hover:shadow-md py-5 px-0">
                  <CardContent className="px-6 py-0">
                    <h2 className="text-lg font-semibold text-slate-900 hover:text-slate-700 leading-tight mb-2">
                      {post.title}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>{post.profiles?.full_name || "익명"}</span>
                      <span>
                        {new Date(post.created_at).toLocaleDateString("ko-KR")}
                      </span>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        <span>{post.likes_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{post.comments_count || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <Card className="border border-slate-200 bg-white">
              <CardContent className="py-12 text-center text-slate-500">
                아직 게시글이 없습니다
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

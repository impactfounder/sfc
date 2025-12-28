import { createClient } from "@/lib/supabase/server";
import { notFound } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone } from 'lucide-react';
import { CommentSection } from "@/components/comment-section";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AnnouncementDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: announcement } = await supabase
    .from("posts")
    .select(`
      *,
      profiles:author_id (full_name, avatar_url)
    `)
    .eq("id", params.id)
    .eq("category", "announcement")
    .single();

  if (!announcement) {
    notFound();
  }

  const { data: comments } = await supabase
    .from("comments")
    .select(`
      *,
      profiles:author_id (id, full_name, avatar_url)
    `)
    .eq("post_id", params.id)
    .order("created_at", { ascending: false });

  const createdAt = new Date(announcement.created_at);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link href="/community/announcements">
            <Button variant="ghost">← 목록으로</Button>
          </Link>
        </div>

        <Card className="mb-6 border-slate-200">
          <CardContent className="p-8">
            <div className="mb-4 flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-blue-600" />
              <Badge variant="secondary">공지사항</Badge>
              <span className="text-sm text-slate-500">
                {createdAt.toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>

            <h1 className="mb-6 text-3xl font-bold text-slate-900">
              {announcement.title}
            </h1>

            <div className="mb-6 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-semibold text-slate-700">
                {announcement.profiles?.full_name?.[0] || 'U'}
              </div>
              <div>
                <p className="font-medium text-slate-900">
                  {announcement.profiles?.full_name || 'Unknown'}
                </p>
                <p className="text-sm text-slate-500">작성자</p>
              </div>
            </div>

            <div className="prose prose-slate max-w-none mb-6">
              <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                {announcement.content}
              </p>
            </div>

          </CardContent>
        </Card>

        <CommentSection 
          postId={announcement.id} 
          userId={user?.id} 
          comments={comments || []} 
          readOnly={true}
        />
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Comment = {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

export function CommentSection({
  postId,
  userId,
  comments: initialComments,
  readOnly = false,
}: {
  postId: string;
  userId?: string;
  comments: Comment[];
  readOnly?: boolean;
}) {
  const [comments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    const supabase = createClient();
    setIsLoading(true);

    try {
      const { error } = await supabase.from("comments").insert({
        post_id: postId,
        author_id: userId,
        content: newComment,
      });

      if (error) throw error;

      setNewComment("");
      router.refresh();
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!readOnly && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>댓글 작성</CardTitle>
          </CardHeader>
          <CardContent>
            {!userId ? (
              <div className="text-center py-8">
                <p className="text-slate-600 mb-4">댓글을 작성하려면 로그인이 필요합니다.</p>
                <Link href="/auth/login">
                  <Button>로그인하기</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                  placeholder="댓글을 입력하세요..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  required
                  rows={4}
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "등록 중..." : "댓글 등록"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {comments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">
            댓글 ({comments.length})
          </h2>
          {comments.map((comment) => (
            <Card key={comment.id} className="border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-700">
                    {comment.profiles?.full_name?.[0] || "U"}
                  </div>
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <p className="font-medium text-slate-900">
                        {comment.profiles?.full_name || "익명"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(comment.created_at).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

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
        <div>
          {!userId ? (
            <div className="text-center py-6 border border-slate-200 rounded-lg bg-slate-50">
              <p className="text-sm text-slate-600 mb-3">댓글을 작성하려면 로그인이 필요합니다.</p>
              <Link href="/auth/login">
                <Button size="sm">로그인하기</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <Textarea
                placeholder="댓글을 입력하세요..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                required
                rows={3}
                className="resize-none"
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading} size="sm">
                  {isLoading ? "등록 중..." : "댓글 등록"}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {comments.length > 0 && (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-b-0 last:pb-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-xs font-semibold text-white flex-shrink-0">
                {comment.profiles?.full_name?.[0] || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="mb-1.5 flex items-center gap-2">
                  <p className="font-semibold text-sm text-slate-900">
                    {comment.profiles?.full_name || "익명"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(comment.created_at).toLocaleDateString("ko-KR", {
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

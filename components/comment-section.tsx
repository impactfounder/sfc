"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { deleteComment } from "@/lib/actions/posts";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Comment = {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
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
  onCommentAdded,
}: {
  postId: string;
  userId?: string;
  comments: Comment[];
  readOnly?: boolean;
  onCommentAdded?: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const supabase = createClient();
    const trimmed = newComment.trim();
    if (!trimmed) return;
    setIsLoading(true);

    try {
      const { data: inserted, error } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          author_id: userId,
          content: trimmed,
        })
        .select(`
          *,
          profiles:author_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      setNewComment("");

      if (inserted) {
        setComments((prev) => [...prev, inserted]);
      }

      // 콜백 호출 (부모 컴포넌트에서 댓글 수 업데이트 등)
      onCommentAdded?.();

      // 서버 컴포넌트인 경우에만 refresh
      if (typeof window === 'undefined' || !onCommentAdded) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setIsDeleting(true);
    try {
      await deleteComment(commentId);
      
      // 댓글 목록에서 삭제된 댓글 제거
      setComments(comments.filter(comment => comment.id !== commentId));
      
      // 콜백 호출 (부모 컴포넌트에서 댓글 수 업데이트 등)
      onCommentAdded?.();
      
      // 서버 컴포넌트인 경우에만 refresh
      if (typeof window === 'undefined' || !onCommentAdded) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
      alert("댓글 삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
      setDeletingCommentId(null);
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
          {comments.map((comment) => {
            const isAuthor = userId && comment.author_id === userId;
            return (
              <div key={comment.id} className="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-b-0 last:pb-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-xs font-semibold text-white flex-shrink-0">
                  {comment.profiles?.full_name?.[0] || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
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
                    {isAuthor && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setDeletingCommentId(comment.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={deletingCommentId !== null} onOpenChange={(open) => !open && setDeletingCommentId(null)}>
        <AlertDialogContent className="bg-white max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>댓글을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 취소할 수 없습니다. 댓글이 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter 
            style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', justifyContent: 'flex-end' }}
            className="!flex !flex-row gap-2 sm:justify-end"
          >
            <AlertDialogCancel variant="outline">취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingCommentId && handleDeleteComment(deletingCommentId)} 
              disabled={isDeleting} 
              variant="destructive" 
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

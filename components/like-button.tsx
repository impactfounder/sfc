"use client";

import { useState, useEffect } from "react";
import { Heart } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const STORAGE_KEY = 'liked_posts';

export function LikeButton({
  postId,
  userId,
  initialLiked,
  initialCount,
  onLikeChange,
}: {
  postId: string;
  userId?: string;
  initialLiked: boolean;
  initialCount: number;
  onLikeChange?: (newCount: number) => void;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isProcessing, setIsProcessing] = useState(false);
  const supabase = createClient();

  // [비로그인] 로컬 스토리지 체크
  useEffect(() => {
    if (!userId && typeof window !== 'undefined') {
      const likedList = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (likedList.includes(postId)) {
        setLiked(true);
      }
    }
  }, [userId, postId]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isProcessing) return;

    // 1. 낙관적 업데이트 (화면 먼저 반영)
    const previousLiked = liked;
    const previousCount = count;
    const newLiked = !liked;
    const newCount = newLiked ? count + 1 : Math.max(0, count - 1);

    setLiked(newLiked);
    setCount(newCount);
    if (onLikeChange) onLikeChange(newCount);

    setIsProcessing(true);

    try {
      if (userId) {
        // [A] 로그인 유저 로직
        if (newLiked) {
          // 좋아요 추가
          const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
          if (error) throw error;
        } else {
          // 좋아요 취소 (삭제)
          const { error } = await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
          if (error) throw error;
        }
      } else {
        // [B] 비로그인 유저 로직
        const likedList = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

        if (newLiked) {
          // 좋아요 추가 RPC
          const { error } = await supabase.rpc('increment_post_likes', { post_id: postId });
          if (error) throw error;

          if (!likedList.includes(postId)) {
            likedList.push(postId);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(likedList));
          }
        } else {
          // 좋아요 취소 RPC (새로 추가된 함수)
          const { error } = await supabase.rpc('decrement_post_likes', { post_id: postId });
          if (error) throw error;

          const newList = likedList.filter((id: string) => id !== postId);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
        }
      }
    } catch (error) {
      console.error("좋아요 처리 실패:", error);
      // 실패 시 롤백
      setLiked(previousLiked);
      setCount(previousCount);
      if (onLikeChange) onLikeChange(previousCount);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      className={cn(
        "gap-1.5 flex-row items-center justify-center p-1.5 min-w-[auto] h-auto hover:bg-slate-100 rounded-lg transition-colors group",
        liked ? "text-red-500 hover:text-red-600 hover:bg-red-50" : "text-slate-400 hover:text-slate-600"
      )}
    >
      <Heart
        className={cn(
            "h-4 w-4 transition-all duration-300",
            liked && "fill-current scale-110",
            !liked && "group-active:scale-90"
        )}
      />
      <span className="text-xs font-medium tabular-nums">{count}</span>
    </Button>
  );
}

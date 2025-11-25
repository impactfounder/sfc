"use client";

import { useState, useEffect } from "react";
import { ChevronUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function LikeButton({
  postId,
  userId: initialUserId,
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
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(initialUserId || null);

  // 사용자 정보 가져오기
  useEffect(() => {
    if (!initialUserId) {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setUserId(user.id);
        }
      });
    }
  }, [initialUserId]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 이벤트 전파 차단
    
    if (!userId) {
      // 로그인 페이지로 리다이렉트하거나 알림 표시
      return;
    }

    const supabase = createClient();
    setIsLoading(true);

    try {
      if (liked) {
        // Unlike
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);

        if (!error) {
          setLiked(false);
          const newCount = Math.max(0, count - 1);
          setCount(newCount);
          onLikeChange?.(newCount);
        }
      } else {
        // Like
        const { error } = await supabase.from("post_likes").insert({
          post_id: postId,
          user_id: userId,
        });

        if (!error) {
          setLiked(true);
          const newCount = count + 1;
          setCount(newCount);
          onLikeChange?.(newCount);
        }
      }
    } catch (error) {
      console.error("Failed to update like:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      disabled={isLoading || !userId}
      className={cn(
        "gap-1 flex-col items-center justify-center p-1.5 min-w-[2.5rem] h-auto hover:bg-slate-100 rounded-lg transition-colors",
        liked ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50" : "text-slate-500 hover:text-slate-700"
      )}
    >
      <ChevronUp className={cn("h-5 w-5", liked && "fill-current")} />
      <span className="text-xs font-bold leading-none">{count}</span>
    </Button>
  );
}

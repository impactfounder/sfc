"use client";

import { useState, useEffect } from "react";
import { Heart } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// 로컬 스토리지 키 (비로그인 유저 중복 방지용)
const STORAGE_KEY = 'liked_posts';

export function LikeButton({
  postId,
  userId,
  initialLiked,
  initialCount,
  onLikeChange,
}: {
  postId: string;
  userId?: string; // 로그인 안 했으면 undefined
  initialLiked: boolean;
  initialCount: number;
  onLikeChange?: (newCount: number) => void;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isProcessing, setIsProcessing] = useState(false);

  // 비로그인 유저가 이미 눌렀는지 로컬 스토리지 확인
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

    if (isProcessing) return; // 중복 클릭 방지

    // 1. 낙관적 업데이트 (화면 먼저 갱신)
    const prevLiked = liked;
    const prevCount = count;

    // 로그인 안 했으면 좋아요 취소 불가 (UX 결정: 비회원은 누르기만 가능하게 함)
    if (!userId && liked) {
        // 이미 눌렀다면 반응 없음 (또는 취소 로직 구현 가능)
        return;
    }

    const newLiked = !liked;
    const newCount = newLiked ? count + 1 : Math.max(0, count - 1);

    setLiked(newLiked);
    setCount(newCount);
    if (onLikeChange) onLikeChange(newCount);

    setIsProcessing(true);
    const supabase = createClient();

    try {
      if (userId) {
        // [A] 로그인 유저: DB 관계 테이블 조작 (Trigger가 카운트 올림)
        if (newLiked) {
          await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
        } else {
          await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
        }
      } else {
        // [B] 비로그인 유저: RPC 함수 호출 (직접 카운트 올림)
        // 비회원은 '취소' 기능을 DB에서 처리하기 복잡하므로 증가만 시킴
        if (newLiked) {
            const { error } = await supabase.rpc('increment_post_likes', { post_id: postId });
            if (error) throw error;

            // 로컬 스토리지에 기록
            const likedList = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            if (!likedList.includes(postId)) {
                likedList.push(postId);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(likedList));
            }
        }
      }
    } catch (error) {
      console.error("좋아요 실패:", error);
      // 실패 시 롤백
      setLiked(prevLiked);
      setCount(prevCount);
      if (onLikeChange) onLikeChange(prevCount);
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

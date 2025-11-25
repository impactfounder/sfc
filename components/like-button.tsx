"use client";

import { useState, useEffect } from "react";
import { Heart } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { likePostAnonymously } from "@/lib/actions/posts";

const STORAGE_KEY = 'liked_posts';

// localStorage에서 좋아요한 게시글 목록 가져오기
function getLikedPosts(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// localStorage에 좋아요한 게시글 ID 저장
function saveLikedPost(postId: string) {
  if (typeof window === 'undefined') return;
  try {
    const liked = getLikedPosts();
    if (!liked.includes(postId)) {
      liked.push(postId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(liked));
    }
  } catch {
    // localStorage 오류 무시
  }
}

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
  const [anonymousLiked, setAnonymousLiked] = useState(false);

  // 사용자 정보 가져오기 및 익명 좋아요 상태 확인
  useEffect(() => {
    if (!initialUserId) {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setUserId(user.id);
        } else {
          // 비로그인 사용자: localStorage 확인
          const likedPosts = getLikedPosts();
          if (likedPosts.includes(postId)) {
            setAnonymousLiked(true);
            setLiked(true);
          }
        }
      });
    }
  }, [initialUserId, postId]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 이벤트 전파 차단
    
    setIsLoading(true);

    try {
      if (userId) {
        // 로그인 사용자: 기존 로직 (post_likes 테이블 사용)
        const supabase = createClient();
        
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
      } else {
        // 비로그인 사용자: 익명 좋아요
        if (anonymousLiked) {
          // 이미 좋아요를 누른 경우 (취소 불가)
          alert("이미 좋아요를 누르셨습니다.");
          return;
        }
        
        // 익명 좋아요 실행
        await likePostAnonymously(postId);
        setAnonymousLiked(true);
        setLiked(true);
        const newCount = count + 1;
        setCount(newCount);
        saveLikedPost(postId);
        onLikeChange?.(newCount);
      }
    } catch (error) {
      console.error("Failed to update like:", error);
      alert("좋아요 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      disabled={isLoading}
      className={cn(
        "gap-1.5 flex-row items-center justify-center p-1.5 min-w-[auto] h-auto hover:bg-slate-100 rounded-lg transition-colors",
        liked ? "text-red-500 hover:text-red-600 hover:bg-red-50" : "text-slate-400 hover:text-slate-600"
      )}
    >
      <Heart className={cn("h-4 w-4", liked && "fill-red-500")} />
      <span className="text-xs font-medium">{count}</span>
    </Button>
  );
}

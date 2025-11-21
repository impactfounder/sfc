"use client";

import { useState } from "react";
import { Heart } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function LikeButton({
  postId,
  userId,
  initialLiked,
  initialCount,
}: {
  postId: string;
  userId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async () => {
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
          setCount((prev) => Math.max(0, prev - 1));
        }
      } else {
        // Like
        const { error } = await supabase.from("post_likes").insert({
          post_id: postId,
          user_id: userId,
        });

        if (!error) {
          setLiked(true);
          setCount((prev) => prev + 1);
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
      disabled={isLoading}
      className={cn(
        "gap-2",
        liked ? "text-red-600 hover:text-red-700" : "text-slate-600"
      )}
    >
      <Heart className={cn("h-4 w-4", liked && "fill-current")} />
      <span>{count}</span>
    </Button>
  );
}

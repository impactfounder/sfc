"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, Loader2 } from 'lucide-react';

export function CompleteEventButton({
  eventId,
  userId,
}: {
  eventId: string;
  userId: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleComplete = async () => {
    const supabase = createClient();
    setIsLoading(true);

    try {
      const { error: updateError } = await supabase
        .from("events")
        .update({ status: 'completed' })
        .eq("id", eventId);

      if (updateError) throw updateError;

      const { error: pointsError } = await supabase.rpc('award_points', {
        p_user_id: userId,
        p_amount: 100,
        p_type: 'event_completion',
        p_description: '이벤트 개설 및 완료',
        p_event_id: eventId
      });

      if (pointsError) throw pointsError;

      router.refresh();
    } catch (error) {
      console.error("Failed to complete event:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleComplete}
      disabled={isLoading}
      className="w-full"
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isLoading ? "처리 중..." : "이벤트 완료 처리 (+100P)"}
    </Button>
  );
}

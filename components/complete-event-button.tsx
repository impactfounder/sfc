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
      variant="outline"
      size="sm"
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <CheckCircle className="mr-2 h-4 w-4" />
      )}
      이벤트 종료하기
    </Button>
  );
}

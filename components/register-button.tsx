"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, Loader2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterButton({
  eventId,
  userId,
  isRegistered: initialRegistered,
  isFull,
}: {
  eventId: string;
  userId?: string;
  isRegistered: boolean;
  isFull: boolean;
}) {
  const [isRegistered, setIsRegistered] = useState(initialRegistered);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [guestName, setGuestName] = useState("");
  const [guestContact, setGuestContact] = useState("");
  const [showGuestForm, setShowGuestForm] = useState(false);
  
  const handleRegister = async () => {
    const supabase = createClient();
    setIsLoading(true);

    try {
      if (isRegistered) {
        const { error } = await supabase
          .from("event_registrations")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", userId);

        if (!error) {
          setIsRegistered(false);
          router.refresh();
        }
      } else {
        const { error } = await supabase.from("event_registrations").insert({
          event_id: eventId,
          user_id: userId,
        });

        if (!error) {
          setIsRegistered(true);
          
          if (userId) {
            await supabase.rpc('award_points', {
              p_user_id: userId,
              p_amount: 10,
              p_type: 'event_participation',
              p_description: '이벤트 참여',
              p_event_id: eventId
            });
          }
          
          router.refresh();
        }
      }
    } catch (error) {
      console.error("Failed to update registration:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestRegister = async () => {
    if (!guestName.trim() || !guestContact.trim()) {
      alert("이름과 연락처를 모두 입력해주세요");
      return;
    }

    const supabase = createClient();
    setIsLoading(true);

    try {
      const { error } = await supabase.from("event_registrations").insert({
        event_id: eventId,
        user_id: null,
        guest_name: guestName,
        guest_contact: guestContact,
      });

      if (!error) {
        setIsRegistered(true);
        router.refresh();
      } else {
        console.error("Guest registration error:", error);
        alert("참가 신청에 실패했습니다. 다시 시도해주세요.");
      }
    } catch (error) {
      console.error("Failed to register as guest:", error);
      alert("참가 신청에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isRegistered) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-700">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">이 이벤트에 참석 신청했습니다</span>
        </div>
        {userId && (
          <Button
            variant="outline"
            onClick={handleRegister}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "취소 중..." : "참석 신청 취소"}
          </Button>
        )}
      </div>
    );
  }

  if (isFull) {
    return (
      <div className="rounded-lg bg-slate-100 p-4 text-center text-slate-600">
        이벤트가 마감되었습니다
      </div>
    );
  }

  if (!userId || showGuestForm) {
    return (
      <div className="space-y-4">
        {!userId && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-700">
            💡 로그인하면 <strong>10포인트</strong>를 적립하고 이벤트 참여 이력을 관리할 수 있어요!
          </div>
        )}
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="guestName" className="text-sm font-medium">이름</Label>
            <Input
              id="guestName"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="홍길동"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="guestContact" className="text-sm font-medium">연락처</Label>
            <Input
              id="guestContact"
              value={guestContact}
              onChange={(e) => setGuestContact(e.target.value)}
              placeholder="010-1234-5678 또는 email@example.com"
              className="mt-1.5"
            />
          </div>
        </div>

        <Button
          onClick={handleGuestRegister}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          size="lg"
        >
          {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          {isLoading ? "신청 중..." : "신청하기"}
        </Button>

        {!userId && (
          <Button
            variant="outline"
            className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
            size="lg"
            onClick={() => window.location.href = "/auth/login"}
          >
            로그인하고 10포인트 받기
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
        <p className="text-green-700 font-medium">
          ✨ 참가 신청 시 <span className="text-lg font-bold">10포인트</span>가 자동으로 적립됩니다
        </p>
      </div>
      
      <Button
        onClick={handleRegister}
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg h-14"
        size="lg"
      >
        {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        {isLoading ? "신청 중..." : "신청하기"}
      </Button>
    </div>
  );
}

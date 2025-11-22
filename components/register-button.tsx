"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, Loader2, Sparkles } from 'lucide-react'; // Sparkles 아이콘 추가
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
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-4 border border-slate-200 text-slate-700">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="font-semibold text-sm">참석이 확정되었습니다</span>
        </div>
        {userId && (
          <Button
            variant="outline"
            onClick={handleRegister}
            disabled={isLoading}
            className="w-full h-12 border-slate-300 hover:bg-slate-50 text-slate-600"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "취소 중..." : "신청 취소하기"}
          </Button>
        )}
      </div>
    );
  }

  if (isFull) {
    return (
      <div className="rounded-lg bg-slate-100 p-4 text-center text-slate-500 text-sm font-medium">
        모집이 마감되었습니다
      </div>
    );
  }

  if (!userId || showGuestForm) {
    return (
      <div className="space-y-4">
        {!userId && (
          <div className="rounded-lg bg-gradient-to-r from-slate-50 to-white border border-slate-200 p-4">
            <p className="text-sm text-slate-700 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              로그인하면 <span className="font-bold">이력 관리</span>가 가능해요!
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="guestName" className="text-sm font-semibold text-slate-700">이름</Label>
            <Input
              id="guestName"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="참석자 성함"
              className="mt-1.5 h-11 bg-slate-50 focus:bg-white transition-colors"
            />
          </div>
          <div>
            <Label htmlFor="guestContact" className="text-sm font-semibold text-slate-700">연락처</Label>
            <Input
              id="guestContact"
              value={guestContact}
              onChange={(e) => setGuestContact(e.target.value)}
              placeholder="연락 받으실 이메일 또는 전화번호"
              className="mt-1.5 h-11 bg-slate-50 focus:bg-white transition-colors"
            />
          </div>
        </div>

        <Button
          onClick={handleGuestRegister}
          disabled={isLoading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 text-base shadow-md transition-all hover:shadow-lg"
        >
          {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          {isLoading ? "처리 중..." : "신청 완료하기"}
        </Button>

        {!userId && (
          <Button
            variant="outline"
            className="w-full h-12 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
            onClick={() => window.location.href = "/auth/login"}
          >
            로그인하고 신청하기 (+10P)
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={handleRegister}
        disabled={isLoading}
        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-base h-12 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
      >
        {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        {isLoading ? "신청 중..." : "지금 신청하기"}
      </Button>
    </div>
  );
}
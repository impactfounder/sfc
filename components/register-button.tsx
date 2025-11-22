"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, Loader2, Sparkles, Coins, AlertCircle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterButton({
  eventId,
  userId,
  isRegistered: initialRegistered,
  isFull,
  userPoints,
  eventPointCost,
}: {
  eventId: string;
  userId?: string;
  isRegistered: boolean;
  isFull: boolean;
  userPoints?: number;
  eventPointCost?: number;
}) {
  const [isRegistered, setIsRegistered] = useState(initialRegistered);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [guestName, setGuestName] = useState("");
  const [guestContact, setGuestContact] = useState("");
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [usedPoints, setUsedPoints] = useState<number>(0);
  const [currentUserPoints, setCurrentUserPoints] = useState<number>(userPoints || 0);

  // 사용자 포인트 가져오기
  useEffect(() => {
    if (userId && !userPoints) {
      const supabase = createClient();
      supabase
        .from("profiles")
        .select("points")
        .eq("id", userId)
        .single()
        .then(({ data }) => {
          if (data) {
            setCurrentUserPoints(data.points || 0);
          }
        });
    } else if (userPoints !== undefined) {
      setCurrentUserPoints(userPoints);
    }
  }, [userId, userPoints]);

  // 최대 사용 가능 포인트 계산
  const maxUsablePoints = eventPointCost
    ? Math.min(currentUserPoints, eventPointCost)
    : currentUserPoints;
  
  const handleRegister = async () => {
    if (!userId) {
      return;
    }

    // 포인트 사용 검증
    if (usedPoints > 0) {
      if (usedPoints < 100) {
        alert("포인트는 최소 100 P 이상부터 사용할 수 있어요.");
        return;
      }
      if (usedPoints > currentUserPoints) {
        alert("보유 포인트가 부족합니다.");
        return;
      }
      if (eventPointCost && usedPoints > eventPointCost) {
        alert(`사용 가능한 포인트는 이벤트 비용(${eventPointCost}P)을 초과할 수 없습니다.`);
        return;
      }
    }

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
        // 포인트를 사용하는 경우 register_event_with_points 함수 사용
        if (usedPoints > 0) {
          const { data, error } = await supabase.rpc('register_event_with_points', {
            p_event_id: eventId,
            p_user_id: userId,
            p_used_points: usedPoints,
          });

          if (error) {
            throw new Error(error.message);
          }

          setIsRegistered(true);
          setUsedPoints(0);
        } else {
          // 포인트를 사용하지 않는 경우 기존 로직
          const { error } = await supabase.from("event_registrations").insert({
            event_id: eventId,
            user_id: userId,
          });

          if (error) {
            throw error;
          }

          // 이벤트 참여 보상 지급
          await supabase.rpc('award_points', {
            p_user_id: userId,
            p_amount: 10,
            p_type: 'event_participation',
            p_description: '이벤트 참여',
            p_event_id: eventId
          });

          setIsRegistered(true);
        }

        // 포인트 정보 갱신
        const { data: profileData } = await supabase
          .from("profiles")
          .select("points")
          .eq("id", userId)
          .single();
        if (profileData) {
          setCurrentUserPoints(profileData.points || 0);
        }

        router.refresh();
      }
    } catch (error: any) {
      console.error("Failed to update registration:", error);
      alert(error?.message || "신청에 실패했습니다. 다시 시도해주세요.");
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
      {/* 포인트 사용 섹션 */}
      {currentUserPoints >= 100 && (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="points" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Coins className="h-4 w-4 text-yellow-600" />
              포인트 사용 (선택)
            </Label>
            <span className="text-xs text-slate-500">
              보유: <span className="font-bold text-slate-900">{currentUserPoints.toLocaleString()}P</span>
            </span>
          </div>
          <Input
            id="points"
            type="number"
            min={0}
            max={maxUsablePoints}
            step={1}
            value={usedPoints || ""}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 0;
              if (value >= 0 && value <= maxUsablePoints) {
                setUsedPoints(value);
              }
            }}
            placeholder="0"
            className="h-11 bg-white focus:bg-white"
          />
          {usedPoints > 0 && usedPoints < 100 && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2.5">
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-800">
                포인트는 <span className="font-bold">100 P</span> 이상부터 사용할 수 있어요.
              </p>
            </div>
          )}
          {usedPoints >= 100 && (
            <p className="text-xs text-slate-600">
              {usedPoints.toLocaleString()}P 사용 시 잔여 {((currentUserPoints || 0) - usedPoints).toLocaleString()}P
            </p>
          )}
          {maxUsablePoints < 100 && (
            <p className="text-xs text-amber-600">
              포인트 사용을 위해서는 최소 100P가 필요합니다. (현재: {currentUserPoints}P)
            </p>
          )}
        </div>
      )}

      <Button
        onClick={handleRegister}
        disabled={isLoading || (usedPoints > 0 && (usedPoints < 100 || usedPoints > currentUserPoints))}
        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-base h-12 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        {isLoading ? "신청 중..." : usedPoints > 0 ? `${usedPoints}P 사용하여 신청하기` : "지금 신청하기"}
      </Button>
      {usedPoints === 0 && (
        <p className="text-xs text-center text-slate-400 font-medium">
          신청 시 <span className="text-slate-900 font-bold underline underline-offset-2">10 포인트</span> 적립 🎁
        </p>
      )}
    </div>
  );
}
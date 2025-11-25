"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, Loader2, Sparkles, Coins, AlertCircle, LogIn } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CustomField = {
  id: string;
  field_name: string;
  field_type: 'text' | 'select';
  field_options: string[] | null;
  is_required: boolean;
};

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

  // 모달 상태
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoadingFields, setIsLoadingFields] = useState(false);

  // 로그인 사용자 정보
  const [userProfile, setUserProfile] = useState<{ full_name?: string; email?: string } | null>(null);

  // 게스트 정보
  const [guestName, setGuestName] = useState("");
  const [guestContact, setGuestContact] = useState("");

  // 포인트 관련
  const [usedPoints, setUsedPoints] = useState<number>(0);
  const [currentUserPoints, setCurrentUserPoints] = useState<number>(userPoints || 0);

  // 커스텀 필드 관련
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [fieldResponses, setFieldResponses] = useState<Record<string, string>>({});

  // 사용자 프로필 및 포인트 로드
  useEffect(() => {
    if (userId) {
      const supabase = createClient();
      supabase
        .from("profiles")
        .select("full_name, email, points")
        .eq("id", userId)
        .single()
        .then(({ data }) => {
          if (data) {
            setUserProfile({ full_name: data.full_name || undefined, email: data.email || undefined });
            setCurrentUserPoints(data.points || 0);
          }
        });
    } else if (userPoints !== undefined) {
      setCurrentUserPoints(userPoints);
    }
  }, [userId, userPoints]);

  // 커스텀 필드 불러오기
  const loadCustomFields = async () => {
    const supabase = createClient();
    setIsLoadingFields(true);
    try {
      const { data, error } = await supabase
        .from("event_registration_fields")
        .select("*")
        .eq("event_id", eventId)
        .order("order_index", { ascending: true });

      if (error) {
        console.error("Failed to load custom fields:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Failed to load custom fields:", error);
      return [];
    } finally {
      setIsLoadingFields(false);
    }
  };

  // 모달 열기 (버튼 클릭 시 항상 모달 열기)
  const handleOpenDialog = async () => {
    const fields = await loadCustomFields();
    setCustomFields(fields);
    setFieldResponses({});
    setIsDialogOpen(true);
  };

  // 최대 사용 가능 포인트 계산
  const maxUsablePoints = eventPointCost
    ? Math.min(currentUserPoints, eventPointCost)
    : currentUserPoints;

  // 로그인 사용자 신청 처리
  const handleUserRegister = async () => {
    if (!userId) return;

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

    // 커스텀 필드 필수 항목 검증
    for (const field of customFields) {
      if (field.is_required && (!fieldResponses[field.id] || fieldResponses[field.id].trim() === '')) {
        alert(`"${field.field_name}"은(는) 필수 항목입니다.`);
        return;
      }
    }

    const supabase = createClient();
    setIsLoading(true);

    try {
      let registrationId: string | null = null;

      // 포인트를 사용하는 경우
      if (usedPoints > 0) {
        const { data, error } = await supabase.rpc('register_event_with_points', {
          p_event_id: eventId,
          p_user_id: userId,
          p_used_points: usedPoints,
        });

        if (error) throw new Error(error.message);

        const { data: regData } = await supabase
          .from("event_registrations")
          .select("id")
          .eq("event_id", eventId)
          .eq("user_id", userId)
          .single();
        
        registrationId = regData?.id || null;
        setUsedPoints(0);
      } else {
        // 포인트를 사용하지 않는 경우
        const { data: regData, error } = await supabase
          .from("event_registrations")
          .insert({
            event_id: eventId,
            user_id: userId,
          })
          .select("id")
          .single();

        if (error) throw error;
        registrationId = regData?.id || null;

        // 이벤트 참여 보상 지급
        await supabase.rpc('award_points', {
          p_user_id: userId,
          p_amount: 10,
          p_type: 'event_participation',
          p_description: '이벤트 참여',
          p_event_id: eventId
        });
      }

      // 커스텀 필드 응답 저장
      if (registrationId && Object.keys(fieldResponses).length > 0) {
        const responsesToInsert = Object.entries(fieldResponses)
          .filter(([_, value]) => value && value.trim() !== '')
          .map(([fieldId, value]) => ({
            registration_id: registrationId!,
            field_id: fieldId,
            response_value: value.trim(),
          }));

        if (responsesToInsert.length > 0) {
          await supabase
            .from("event_registration_responses")
            .insert(responsesToInsert);
        }
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

      setIsRegistered(true);
      setIsDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error("Failed to register:", error);
      alert(error?.message || "신청에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  // 게스트 신청 처리
  const handleGuestRegister = async () => {
    if (!guestName.trim() || !guestContact.trim()) {
      alert("이름과 연락처를 모두 입력해주세요");
      return;
    }

    // 커스텀 필드 필수 항목 검증
    for (const field of customFields) {
      if (field.is_required && (!fieldResponses[field.id] || fieldResponses[field.id].trim() === '')) {
        alert(`"${field.field_name}"은(는) 필수 항목입니다.`);
        return;
      }
    }

    const supabase = createClient();
    setIsLoading(true);

    try {
      const { data: regData, error } = await supabase
        .from("event_registrations")
        .insert({
          event_id: eventId,
          user_id: null,
          guest_name: guestName.trim(),
          guest_contact: guestContact.trim(),
        })
        .select("id")
        .single();

      if (error) throw error;

      const registrationId = regData?.id || null;

      // 커스텀 필드 응답 저장
      if (registrationId && Object.keys(fieldResponses).length > 0) {
        const responsesToInsert = Object.entries(fieldResponses)
          .filter(([_, value]) => value && value.trim() !== '')
          .map(([fieldId, value]) => ({
            registration_id: registrationId,
            field_id: fieldId,
            response_value: value.trim(),
          }));

        if (responsesToInsert.length > 0) {
          await supabase
            .from("event_registration_responses")
            .insert(responsesToInsert);
        }
      }

      setIsRegistered(true);
      setIsDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error("Failed to register as guest:", error);
      alert(error?.message || "참가 신청에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  // 신청 취소
  const handleCancel = async () => {
    if (!userId) return;

    const supabase = createClient();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("event_registrations")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", userId);

      if (error) throw error;

      setIsRegistered(false);
      router.refresh();
    } catch (error: any) {
      console.error("Failed to cancel:", error);
      alert("취소에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  // 이미 신청한 경우
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
            onClick={handleCancel}
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

  // 마감된 경우
  if (isFull) {
    return (
      <div className="rounded-lg bg-slate-100 p-4 text-center text-slate-500 text-sm font-medium">
        모집이 마감되었습니다
      </div>
    );
  }

  // 메인 버튼 (항상 모달 열기)
  return (
    <>
      <div className="space-y-4">
        {/* 포인트 사용 섹션 (로그인 사용자만) */}
        {userId && currentUserPoints >= 100 && (
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
          </div>
        )}

        <Button
          onClick={handleOpenDialog}
          disabled={isLoading || (userId && usedPoints > 0 && (usedPoints < 100 || usedPoints > currentUserPoints))}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-base h-12 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          {isLoading ? "처리 중..." : userId 
            ? (usedPoints > 0 ? `${usedPoints}P 사용하여 신청하기` : "지금 신청하기")
            : "참가 신청하기"}
        </Button>
        {userId && usedPoints === 0 && (
          <p className="text-xs text-center text-slate-400 font-medium">
            신청 시 <span className="text-slate-900 font-bold underline underline-offset-2">10 포인트</span> 적립 🎁
          </p>
        )}
      </div>

      {/* 신청 모달 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>참가 신청서</DialogTitle>
          </DialogHeader>
          
          {isLoadingFields ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="space-y-6 mt-4">
              {/* 비로그인 사용자: 로그인 추천 버튼 */}
              {!userId && (
                <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4">
                  <Button
                    variant="outline"
                    className="w-full border-blue-300 bg-white hover:bg-blue-50 text-blue-700 font-semibold h-11"
                    onClick={() => {
                      setIsDialogOpen(false);
                      router.push("/auth/login");
                    }}
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    로그인하고 신청하기 (추천) +10P 적립
                  </Button>
                </div>
              )}

              {/* 로그인 사용자: 기본 정보 표시 */}
              {userId && userProfile && (
                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">기본 정보</h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-slate-500">이름</Label>
                      <p className="text-sm font-medium text-slate-900">{userProfile.full_name || "이름 없음"}</p>
                    </div>
                    {userProfile.email && (
                      <div>
                        <Label className="text-xs text-slate-500">이메일</Label>
                        <p className="text-sm font-medium text-slate-900">{userProfile.email}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 비로그인 사용자: 이름/연락처 입력 */}
              {!userId && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="guestName" className="text-sm font-semibold text-slate-700">
                      이름 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="guestName"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="참석자 성함"
                      className="mt-1.5 h-11 bg-slate-50 focus:bg-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="guestContact" className="text-sm font-semibold text-slate-700">
                      연락처 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="guestContact"
                      value={guestContact}
                      onChange={(e) => setGuestContact(e.target.value)}
                      placeholder="이메일 또는 전화번호"
                      className="mt-1.5 h-11 bg-slate-50 focus:bg-white"
                      required
                    />
                  </div>
                </div>
              )}

              {/* 커스텀 필드 */}
              {customFields.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-900">추가 질문</h3>
                  {customFields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">
                        {field.field_name}
                        {field.is_required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      
                      {field.field_type === 'text' ? (
                        <Input
                          placeholder="답변을 입력해주세요"
                          value={fieldResponses[field.id] || ''}
                          onChange={(e) => {
                            setFieldResponses({
                              ...fieldResponses,
                              [field.id]: e.target.value,
                            });
                          }}
                          className="bg-slate-50"
                          required={field.is_required}
                        />
                      ) : (
                        <Select
                          value={fieldResponses[field.id] || ''}
                          onValueChange={(value) => {
                            setFieldResponses({
                              ...fieldResponses,
                              [field.id]: value,
                            });
                          }}
                          required={field.is_required}
                        >
                          <SelectTrigger className="bg-slate-50">
                            <SelectValue placeholder="선택해주세요" />
                          </SelectTrigger>
                          <SelectContent>
                            {(field.field_options as string[] || []).map((option, index) => (
                              <SelectItem key={index} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 커스텀 필드가 없을 때 확인 메시지 (로그인 사용자만) */}
              {userId && customFields.length === 0 && (
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-center">
                  <p className="text-sm text-slate-700">신청하시겠습니까?</p>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isLoading}
                >
                  취소
                </Button>
                <Button
                  onClick={() => {
                    if (userId) {
                      handleUserRegister();
                    } else {
                      handleGuestRegister();
                    }
                  }}
                  disabled={isLoading || (!userId && (!guestName.trim() || !guestContact.trim()))}
                  className="bg-slate-900 hover:bg-slate-800"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  신청 완료
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

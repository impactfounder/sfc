"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, Loader2, LogIn } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { registerGuestForEvent, registerUserForEvent } from "@/lib/actions/event-registrations";

type CustomField = {
  id: string;
  field_name: string;
  field_type: "text" | "select";
  field_options: string[] | null;
  is_required: boolean;
};

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
  price?: number | null;
  paymentStatus?: string;
}) {
  const [isRegistered, setIsRegistered] = useState(initialRegistered);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // 모달 상태
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isLoadingFields, setIsLoadingFields] = useState(false);

  // 사용자 정보
  const [userProfile, setUserProfile] = useState<{ full_name?: string; email?: string } | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestContact, setGuestContact] = useState("");

  // 커스텀 필드
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [fieldResponses, setFieldResponses] = useState<Record<string, string>>({});

  // 사용자 프로필 로드
  useEffect(() => {
    if (userId) {
      const supabase = createClient();
      supabase.from("profiles").select("full_name, email").eq("id", userId).single().then(({ data }) => {
        if (data) {
          setUserProfile({ full_name: data.full_name || undefined, email: data.email || undefined });
          if (data.full_name) setGuestName(data.full_name);
        }
      });
    }
  }, [userId]);

  // 커스텀 필드 로드
  const loadCustomFields = async () => {
    const supabase = createClient();
    setIsLoadingFields(true);

    // 타임아웃 설정 (10초)
    const timeoutId = setTimeout(() => {
      console.warn("[RegisterButton] Custom fields loading timeout");
      setIsLoadingFields(false);
    }, 10000);

    try {
      const { data, error } = await supabase
        .from("event_registration_fields")
        .select("id, field_name, field_type, field_options, is_required, order_index")
        .eq("event_id", eventId)
        .order("order_index", { ascending: true });

      clearTimeout(timeoutId);

      if (error) {
        console.error("[RegisterButton] Failed to load custom fields - Error:", error);
        return [];
      }

      return (data as any) || [];
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("[RegisterButton] Error loading custom fields:", error);
      return [];
    } finally {
      clearTimeout(timeoutId);
      setIsLoadingFields(false);
    }
  };

  // 버튼 클릭 핸들러 (항상 모달 열기)
  const handleOpenDialog = async () => {
    setIsDialogOpen(true);
    setCustomFields([]);
    setFieldResponses({});

    if (userId) {
      const supabase = createClient();
      const timeoutId = setTimeout(() => {
        console.warn("[RegisterButton] User profile loading timeout");
      }, 5000);

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", userId)
          .single();

        clearTimeout(timeoutId);

        if (profile) {
          setUserProfile(profile);
          setGuestName(profile.full_name || "");
          setGuestContact(profile.email || "");
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.error("[RegisterButton] Failed to load user profile:", error);
      }
    }

    loadCustomFields().then((fields) => {
      setCustomFields(fields);
      setFieldResponses({});
    }).catch((error) => {
      console.error("[RegisterButton] Failed to load custom fields in handleOpenDialog:", error);
      setCustomFields([]);
      setFieldResponses({});
    });
  };

  // 로그인 사용자 신청
  const handleUserRegister = async () => {
    if (!userId) return;

    if (!guestName.trim() || !guestContact.trim()) {
      toast({ variant: "destructive", title: "입력 필요", description: "이름과 연락처를 모두 입력해주세요" });
      return;
    }

    // 커스텀 필드 필수 항목 검증
    for (const field of customFields) {
      if (field.is_required && (!fieldResponses[field.id] || fieldResponses[field.id].trim() === '')) {
        toast({
          variant: "destructive",
          title: "필수 항목",
          description: `"${field.field_name}"은(는) 필수 항목입니다.`,
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      await registerUserForEvent(
        eventId,
        userId,
        guestName.trim() || null,
        guestContact.trim() || null,
        null,
        fieldResponses
      );

      setIsRegistered(true);
      setIsDialogOpen(false);
      router.refresh();

      toast({
        title: "신청 완료",
        description: "이벤트 참가 신청이 완료되었습니다.",
      });

    } catch (error: any) {
      console.error("[RegisterButton] Registration Error:", error);
      const errorMessage = error?.message || error?.toString() || "신청에 실패했습니다. 다시 시도해주세요.";

      toast({
        variant: "destructive",
        title: "신청 실패",
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 게스트 신청
  const handleGuestRegister = async () => {
    if (!guestName.trim() || !guestContact.trim()) {
      toast({ variant: "destructive", title: "입력 필요", description: "이름과 연락처를 모두 입력해주세요" });
      return;
    }

    // 커스텀 필드 필수 항목 검증
    for (const field of customFields) {
      if (field.is_required && (!fieldResponses[field.id] || fieldResponses[field.id].trim() === '')) {
        toast({
          variant: "destructive",
          title: "필수 항목",
          description: `"${field.field_name}"은(는) 필수 항목입니다.`,
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      await registerGuestForEvent(
        eventId,
        guestName.trim(),
        guestContact.trim(),
        null,
        fieldResponses
      );

      setIsRegistered(true);
      setIsDialogOpen(false);
      router.refresh();

      toast({
        title: "신청 완료",
        description: "이벤트 참가 신청이 완료되었습니다.",
      });

    } catch (error: any) {
      console.error("[RegisterButton] Guest Registration Error:", error);
      const errorMessage = error?.message || error?.toString() || "참가 신청에 실패했습니다. 다시 시도해주세요.";

      toast({
        variant: "destructive",
        title: "신청 실패",
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 취소
  const handleCancel = async () => {
    if (!userId) return;
    const supabase = createClient();
    setIsLoading(true);
    try {
      await supabase.from("event_registrations").delete().eq("event_id", eventId).eq("user_id", userId);
      setIsRegistered(false);
      router.refresh();
      toast({
        title: "취소 완료",
        description: "참가 신청이 취소되었습니다.",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "취소 실패",
        description: "취소에 실패했습니다. 다시 시도해주세요.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------------------------------------------------
  // 렌더링
  // ------------------------------------------------------------

  // 1. 신청 완료 상태
  if (initialRegistered) {
    return (
      <>
        <button
          type="button"
          onClick={() => {
            if (userId) {
              setShowCancelDialog(true);
            }
          }}
          disabled={!userId}
          className={`w-full flex items-center justify-center gap-2 rounded-xl bg-slate-50 p-4 border border-slate-200 text-slate-700 transition-colors ${
            userId ? 'hover:bg-slate-100 cursor-pointer' : 'cursor-default'
          }`}
        >
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="font-semibold text-sm">참가 신청이 완료되었습니다</span>
        </button>

        {/* 취소 확인 다이얼로그 */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>참가 취소</DialogTitle>
              <DialogDescription>
                정말 참가를 취소하시겠습니까?
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 pt-4">
              <button
                type="button"
                onClick={async () => {
                  await handleCancel();
                  setShowCancelDialog(false);
                }}
                disabled={isLoading}
                className="w-full h-11 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    취소 중...
                  </span>
                ) : (
                  "참가 취소하기"
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowCancelDialog(false)}
                className="w-full h-11 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors"
              >
                돌아가기
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // 2. 마감 상태
  if (isFull) {
    return <div className="rounded-lg bg-slate-100 p-4 text-center text-slate-500 text-sm font-medium">모집이 마감되었습니다</div>;
  }

  // 3. 기본 상태 (버튼)
  return (
    <>
      <div className="space-y-3">
        <Button
          onClick={handleOpenDialog}
          disabled={isLoading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-base h-12 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
        >
          {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "참가 신청하기"}
        </Button>
      </div>

      {/* 신청 정보 입력 모달 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] md:max-h-[85vh] overflow-y-auto overscroll-contain">
          <DialogHeader>
            <DialogTitle>참가 신청서</DialogTitle>
            <DialogDescription>이벤트 참가 신청을 위해 아래 정보를 입력해주세요.</DialogDescription>
          </DialogHeader>

          {isLoadingFields ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400 mb-2" />
              <p className="text-sm text-slate-500">정보를 불러오는 중...</p>
            </div>
          ) : (
            <div className="space-y-6 mt-4 pb-4">
              {/* 비로그인 사용자 로그인 유도 */}
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
                    로그인하고 신청하기 (추천)
                  </Button>
                </div>
              )}

              {/* 입력 폼 */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="guestName">이름 <span className="text-red-500">*</span></Label>
                  <Input
                    id="guestName"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    onFocus={(e) => {
                      setTimeout(() => {
                        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 300);
                    }}
                    placeholder="성함을 입력해주세요"
                    className="mt-1.5 h-11 bg-slate-50"
                  />
                </div>
                <div>
                  <Label htmlFor="guestContact">연락처 <span className="text-red-500">*</span></Label>
                  <Input
                    id="guestContact"
                    value={guestContact}
                    onChange={(e) => setGuestContact(e.target.value)}
                    onFocus={(e) => {
                      setTimeout(() => {
                        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 300);
                    }}
                    placeholder="010-0000-0000"
                    className="mt-1.5 h-11 bg-slate-50"
                  />
                </div>
              </div>

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
                          onFocus={(e) => {
                            setTimeout(() => {
                              e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 300);
                          }}
                          className="bg-slate-50 focus:bg-white"
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
                          <SelectTrigger className="bg-slate-50 focus:bg-white">
                            <SelectValue placeholder="선택해주세요" />
                          </SelectTrigger>
                          <SelectContent className="z-[9999] bg-white">
                            {(() => {
                              let options: string[] = [];
                              if (field.field_options) {
                                if (Array.isArray(field.field_options)) {
                                  options = field.field_options;
                                } else if (typeof field.field_options === 'string') {
                                  try {
                                    options = JSON.parse(field.field_options);
                                  } catch (e) {
                                    console.error('Failed to parse field_options:', e);
                                  }
                                }
                              }
                              return options.map((option, index) => (
                                <SelectItem key={index} value={option}>
                                  {option}
                                </SelectItem>
                              ));
                            })()}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 하단 액션 버튼 */}
              <div className="flex flex-col gap-3 pt-6 border-t mt-6 pb-2">
                <Button
                  onClick={() => userId ? handleUserRegister() : handleGuestRegister()}
                  disabled={isLoading || (!guestName.trim() || !guestContact.trim())}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12"
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "신청 완료"}
                </Button>

                <div className="text-center mt-2">
                  <button
                    onClick={() => setIsDialogOpen(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-4"
                  >
                    취소하고 닫기
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

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
import { TossPaymentWidget } from "@/components/payment/toss-payment-widget";
import { registerGuestForEvent, registerUserForEvent } from "@/lib/actions/event-registrations";

type CustomField = {
  id: string;
  field_name: string;
  field_type: "text" | "select";
  field_options: string[] | null;
  is_required: boolean;
};

// [추가] 짧고 유니크한 주문 ID 생성 함수 (64자 제한 준수)
function generateOrderId() {
  const timestamp = Date.now().toString(36); // 타임스탬프를 36진수로 변환 (짧아짐)
  const random = Math.random().toString(36).substring(2, 9); // 랜덤 문자열
  return `ORD-${timestamp}-${random}`.toUpperCase();
}

export function RegisterButton({
  eventId,
  userId,
  isRegistered: initialRegistered,
  isFull,
  price = 0,
  paymentStatus = 'pending',
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
  const [showPayment, setShowPayment] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState("");
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
      // 에러 발생 시에도 빈 배열 반환하여 폼이 계속 작동하도록 함
      return [];
    } finally {
      // 항상 로딩 상태 해제
      clearTimeout(timeoutId);
      setIsLoadingFields(false);
    }
  };

  // 버튼 클릭 핸들러 (항상 모달 열기)
  const handleOpenDialog = async () => {
    // 먼저 모달을 열고 기본값 설정
    setIsDialogOpen(true);
    setCustomFields([]);
    setFieldResponses({});
    
    // 사용자 정보 로드 (비동기로 실행, 블로킹하지 않음)
    if (userId) {
      const supabase = createClient();
      // 타임아웃 설정 (5초)
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
        // 에러 발생해도 계속 진행
      }
    }
    
    // 커스텀 필드 로드 (비동기로 실행)
    loadCustomFields().then((fields) => {
      setCustomFields(fields);
      setFieldResponses({});
    }).catch((error) => {
      console.error("[RegisterButton] Failed to load custom fields in handleOpenDialog:", error);
      // 에러 발생 시에도 빈 배열로 설정하여 폼이 계속 작동하도록 함
      setCustomFields([]);
      setFieldResponses({});
    });
  };

  // 로그인 사용자 신청
  const handleUserRegister = async (payNow: boolean) => {
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
      // 서버 액션 사용 (안드로이드 네트워크 문제 해결)
      await registerUserForEvent(
        eventId,
        userId,
        guestName.trim() || null,
        guestContact.trim() || null,
        (price ?? 0) > 0 ? 'pending' : null,
        fieldResponses
      );

      setIsRegistered(true);
      setIsDialogOpen(false);
      router.refresh();

      // [결제하기]를 선택했고 유료인 경우 결제창 오픈
      if (payNow && price && price > 0) {
        const newOrderId = generateOrderId();
        setPaymentOrderId(newOrderId);
        setShowPayment(true);
      }

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
  const handleGuestRegister = async (payNow: boolean) => {
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
      // 서버 액션 사용 (안드로이드 네트워크 문제 해결)
      await registerGuestForEvent(
        eventId,
        guestName.trim(),
        guestContact.trim(),
        (price ?? 0) > 0 ? 'pending' : null,
        fieldResponses
      );

      setIsRegistered(true);
      setIsDialogOpen(false);
      router.refresh();

      // [결제하기]를 선택했고 유료인 경우 결제창 오픈
      if (payNow && price && price > 0) {
        const newOrderId = generateOrderId();
        setPaymentOrderId(newOrderId);
        setShowPayment(true);
      }

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

  // 1. 결제 완료 상태
  const isPaid = paymentStatus === 'paid';
  if (initialRegistered && isPaid) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-4 border border-slate-200 text-slate-700">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <span className="font-semibold text-sm">신청 및 결제가 완료되었습니다</span>
      </div>
    );
  }

  // 2. 마감 상태
  if (isFull && !initialRegistered) {
    return <div className="rounded-lg bg-slate-100 p-4 text-center text-slate-500 text-sm font-medium">모집이 마감되었습니다</div>;
  }

  // 3. 기본 상태 (버튼)
  return (
    <>
      <div className="space-y-3">
        {/* Case A: 신청 완료했으나 미결제 상태 */}
        {initialRegistered && (price ?? 0) > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 border border-amber-200 text-amber-800 mb-2">
              <div className="shrink-0 animate-pulse w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-sm font-medium">신청 완료! 결제가 대기 중입니다.</span>
            </div>
            <Button
              onClick={() => {
                const newOrderId = generateOrderId(); // [수정] 짧은 ID 사용
                setPaymentOrderId(newOrderId);
                setShowPayment(true);
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12"
            >
              지금 결제하기
            </Button>
            <Button variant="outline" onClick={handleCancel} className="w-full h-11 text-slate-500">
              신청 취소하기
            </Button>
          </div>
        ) : (
          /* Case B: 미신청 상태 -> 버튼 하나로 통합 */
          <Button
            onClick={handleOpenDialog}
            disabled={isLoading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-base h-12 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
          >
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "참가 신청하기"}
          </Button>
        )}
      </div>

      {/* 1. 신청 정보 입력 모달 */}
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
                      // 모바일에서 입력 필드에 포커스가 갈 때 스크롤
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
                      // 모바일에서 입력 필드에 포커스가 갈 때 스크롤
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
                            // 모바일에서 입력 필드에 포커스가 갈 때 스크롤
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
                              // field_options가 JSONB이므로 안전하게 파싱
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

              {/* 커스텀 필드가 없을 때 확인 메시지 (로그인 사용자만) */}
              {userId && customFields.length === 0 && (
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-center">
                  <p className="text-sm text-slate-700">신청하시겠습니까?</p>
                </div>
              )}

              {/* 하단 액션 버튼 (분기 처리) */}
              <div className="flex flex-col gap-3 pt-6 border-t mt-6 pb-2">
                {(price ?? 0) > 0 ? (
                  <>
                    <Button
                      onClick={() => userId ? handleUserRegister(true) : handleGuestRegister(true)}
                      disabled={isLoading || (!guestName.trim() || !guestContact.trim())}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 text-base"
                    >
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "결제하고 신청 완료"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => userId ? handleUserRegister(false) : handleGuestRegister(false)}
                      disabled={isLoading || (!guestName.trim() || !guestContact.trim())}
                      className="w-full h-12 text-slate-600 border-slate-300 hover:bg-slate-50"
                    >
                      일단 신청하고 나중에 결제하기
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => userId ? handleUserRegister(false) : handleGuestRegister(false)}
                    disabled={isLoading || (!guestName.trim() || !guestContact.trim())}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-12"
                  >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "신청 완료"}
                  </Button>
                )}
                
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

      {/* 2. 결제 위젯 모달 */}
      <Dialog open={showPayment} onOpenChange={(open) => {
        setShowPayment(open);
        if (!open) {
          // 모달이 닫힐 때 orderId 초기화
          setPaymentOrderId("");
        }
      }}>
        <DialogContent className="max-w-2xl bg-white p-6">
          <DialogHeader>
            <DialogTitle>결제하기</DialogTitle>
            <DialogDescription>결제를 진행하여 이벤트 신청을 완료합니다.</DialogDescription>
          </DialogHeader>
          
          {paymentOrderId && (
            <TossPaymentWidget
              amount={price || 0}
              orderId={paymentOrderId}
              orderName="SFC 이벤트 참가"
              customerName={userProfile?.full_name || guestName || "Guest"}
              customerEmail={userProfile?.email || guestContact || "guest@example.com"}
              successUrl="/payment/success"
              failUrl="/payment/fail"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
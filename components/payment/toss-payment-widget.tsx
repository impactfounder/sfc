"use client";

import { useState } from "react";
import { loadTossPayments } from "@tosspayments/payment-sdk";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TossPaymentWidgetProps {
  amount: number;
  orderId: string;
  orderName: string;
  customerName: string;
  customerEmail: string;
  successUrl: string;
  failUrl: string;
}

export function TossPaymentWidget({
  amount,
  orderId,
  orderName,
  customerName,
  customerEmail,
  successUrl,
  failUrl,
}: TossPaymentWidgetProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

    if (!clientKey) {
      toast({
        variant: "destructive",
        title: "설정 오류",
        description: "클라이언트 키가 설정되지 않았습니다.",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // 1. 토스페이먼츠 객체 로드
      const tossPayments = await loadTossPayments(clientKey);

      // 2. 결제창 호출 (카드 결제 기준)
      await tossPayments.requestPayment("카드", {
        amount: amount,
        orderId: orderId,
        orderName: orderName,
        customerName: customerName,
        customerEmail: customerEmail,
        successUrl: `${window.location.origin}${successUrl}`,
        failUrl: `${window.location.origin}${failUrl}`,
      });
    } catch (error: any) {
      console.error("결제 실패:", error);
      
      if (error.code === "USER_CANCEL") {
        // 사용자가 결제창을 닫은 경우 -> 아무것도 안 함
      } else {
        toast({
          variant: "destructive",
          title: "결제 실패",
          description: error.message || "결제 진행 중 오류가 발생했습니다.",
        });
      }
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full py-8 flex flex-col items-center justify-center text-center space-y-4">
      <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 w-full mb-4">
        <p className="text-slate-500 text-sm mb-1">결제 금액</p>
        <p className="text-3xl font-bold text-slate-900">{amount.toLocaleString()}원</p>
        <p className="text-slate-400 text-xs mt-2">{orderName}</p>
      </div>

      <Button
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-14 text-lg rounded-xl shadow-lg transition-all hover:scale-[1.02]"
        onClick={handlePayment}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            결제창 띄우는 중...
          </>
        ) : (
          "결제하기"
        )}
      </Button>
      
      <p className="text-xs text-slate-400">
        버튼을 누르면 토스페이먼츠 결제창이 열립니다.
      </p>
    </div>
  );
}

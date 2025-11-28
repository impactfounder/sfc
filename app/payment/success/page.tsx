"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, AlertCircle, Calendar } from "lucide-react";
import Link from "next/link";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [registrationId, setRegistrationId] = useState<string | null>(null);

  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");

  useEffect(() => {
    if (!paymentKey || !orderId || !amount) {
      setStatus("error");
      setErrorMessage("결제 정보가 올바르지 않습니다.");
      return;
    }

    async function confirmPayment() {
      try {
        const response = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: parseInt(amount, 10),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setStatus("error");
          setErrorMessage(data.error || "결제 승인에 실패했습니다.");
          return;
        }

        setStatus("success");
        setRegistrationId(data.registrationId);
      } catch (error) {
        console.error("Payment confirmation error:", error);
        setStatus("error");
        setErrorMessage("결제 승인 처리 중 오류가 발생했습니다.");
      }
    }

    confirmPayment();
  }, [paymentKey, orderId, amount]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === "loading" && (
            <>
              <div className="flex justify-center mb-4">
                <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
              </div>
              <CardTitle className="text-2xl">결제 처리 중...</CardTitle>
            </>
          )}
          {status === "success" && (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">결제 완료</CardTitle>
            </>
          )}
          {status === "error" && (
            <>
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-16 w-16 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-600">결제 실패</CardTitle>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {status === "loading" && (
            <p className="text-center text-slate-600">
              결제를 확인하고 있습니다. 잠시만 기다려주세요.
            </p>
          )}

          {status === "success" && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 text-center">
                  결제가 성공적으로 완료되었습니다.
                </p>
                {amount && (
                  <p className="text-lg font-bold text-green-900 text-center mt-2">
                    {parseInt(amount, 10).toLocaleString()}원
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <Button asChild className="w-full">
                  <Link href="/events">
                    <Calendar className="mr-2 h-4 w-4" />
                    이벤트 목록으로
                  </Link>
                </Button>
                {registrationId && (
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/events/${orderId?.replace(/^event-([^-]+)-.*/, "$1")}`}>
                      내역 보기
                    </Link>
                  </Button>
                )}
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 text-center">
                  {errorMessage}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button asChild className="w-full">
                  <Link href="/events">
                    이벤트 목록으로
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.back()}
                >
                  다시 시도
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}


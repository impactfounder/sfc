import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentKey, orderId, amount } = body;

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { error: "필수 파라미터가 누락되었습니다." },
        { status: 400 }
      );
    }

    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "서버 설정 오류: TOSS_SECRET_KEY가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // 토스페이먼츠 승인 API 호출
    const confirmResponse = await fetch(
      "https://api.tosspayments.com/v1/payments/confirm",
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${Buffer.from(secretKey + ":").toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount,
        }),
      }
    );

    const paymentData = await confirmResponse.json();

    if (!confirmResponse.ok) {
      console.error("Toss payment confirmation failed:", paymentData);
      return NextResponse.json(
        { error: paymentData.message || "결제 승인에 실패했습니다." },
        { status: confirmResponse.status }
      );
    }

    // orderId에서 eventId 추출 (형식: event-{eventId}-{timestamp})
    const eventIdMatch = orderId.match(/^event-([^-]+)-/);
    if (!eventIdMatch) {
      return NextResponse.json(
        { error: "잘못된 주문 ID 형식입니다." },
        { status: 400 }
      );
    }
    const eventId = eventIdMatch[1];

    // Supabase 클라이언트 생성
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 결제 정보에서 고객 정보 추출
    const customerName = paymentData.customer?.name || paymentData.customerName || "";
    const customerEmail = paymentData.customer?.email || paymentData.customerEmail || "";

    // 원자적 이벤트 등록 (Race Condition 방지)
    // RPC 함수를 사용하여 정원 체크와 등록을 하나의 트랜잭션으로 처리
    const { data: rpcResult, error: rpcError } = await supabase.rpc('register_for_event', {
      p_event_id: eventId,
      p_user_id: user?.id || null,
      p_guest_name: user ? null : customerName,
      p_guest_contact: user ? null : customerEmail,
    });

    if (rpcError) {
      console.error("RPC error:", rpcError);

      // RPC 함수가 없는 경우 기존 방식으로 폴백
      if (rpcError.code === "42883") {
        console.warn("register_for_event 함수가 없습니다. 기존 방식으로 등록합니다.");

        // 기존 방식 (폴백)
        const { data: event } = await supabase
          .from("events")
          .select("max_participants")
          .eq("id", eventId)
          .single();

        const { count: currentCount } = await supabase
          .from("event_registrations")
          .select("*", { count: "exact", head: true })
          .eq("event_id", eventId);

        if (event?.max_participants && currentCount && currentCount >= event.max_participants) {
          return NextResponse.json(
            { error: "이벤트 정원이 마감되었습니다." },
            { status: 400 }
          );
        }

        const registrationData: any = {
          event_id: eventId,
          registered_at: new Date().toISOString(),
          ...(user ? { user_id: user.id } : { guest_name: customerName, guest_contact: customerEmail }),
        };

        const { data: fallbackReg, error: insertError } = await supabase
          .from("event_registrations")
          .insert(registrationData)
          .select("id")
          .single();

        if (insertError) {
          if (insertError.code === "23505") {
            return NextResponse.json({ error: "이미 등록된 이벤트입니다." }, { status: 400 });
          }
          return NextResponse.json({ error: "등록 처리 중 오류가 발생했습니다." }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          registrationId: fallbackReg.id,
          paymentData: {
            paymentKey: paymentData.paymentKey,
            orderId: paymentData.orderId,
            amount: paymentData.totalAmount,
          },
        });
      }

      return NextResponse.json(
        { error: "등록 처리 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // RPC 결과 처리
    const registration = rpcResult?.[0];
    if (!registration?.success) {
      return NextResponse.json(
        { error: registration?.message || "등록 처리 중 오류가 발생했습니다." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      registrationId: registration.registration_id,
      paymentData: {
        paymentKey: paymentData.paymentKey,
        orderId: paymentData.orderId,
        amount: paymentData.totalAmount,
      },
    });
  } catch (error) {
    console.error("Payment confirmation error:", error);
    return NextResponse.json(
      { error: "결제 승인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


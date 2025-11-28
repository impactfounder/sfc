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

    // 이벤트 정보 조회
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, title, max_participants")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "이벤트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 참가자 수 확인
    const { count: currentCount } = await supabase
      .from("event_registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);

    if (event.max_participants && currentCount && currentCount >= event.max_participants) {
      return NextResponse.json(
        { error: "이벤트 정원이 마감되었습니다." },
        { status: 400 }
      );
    }

    // 결제 정보에서 고객 정보 추출
    const customerName = paymentData.customer?.name || paymentData.customerName || "";
    const customerEmail = paymentData.customer?.email || paymentData.customerEmail || "";

    // event_registrations에 데이터 insert
    const registrationData: any = {
      event_id: eventId,
      registered_at: new Date().toISOString(),
    };

    if (user) {
      // 로그인 유저
      registrationData.user_id = user.id;
    } else {
      // 비회원
      registrationData.guest_name = customerName;
      registrationData.guest_contact = customerEmail;
    }

    const { data: registration, error: registrationError } = await supabase
      .from("event_registrations")
      .insert(registrationData)
      .select("id")
      .single();

    if (registrationError) {
      console.error("Failed to create registration:", registrationError);
      
      // 중복 등록 체크
      if (registrationError.code === "23505") {
        return NextResponse.json(
          { error: "이미 등록된 이벤트입니다." },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "등록 처리 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      registrationId: registration.id,
      paymentData: {
        paymentKey: paymentData.paymentKey,
        orderId: paymentData.orderId,
        amount: paymentData.totalAmount,
      },
    });
  } catch (error) {
    console.error("Payment confirmation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "결제 승인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RegisterButton } from "@/components/register-button";
import { EventShareButton } from "@/components/event-share-button";
import Link from "next/link";

interface FloatingActionBarProps {
  eventId: string;
  userId?: string;
  isRegistered: boolean;
  paymentStatus?: string;
  isFull: boolean;
  price: number;
  isPastEvent: boolean;
  isCreator: boolean;
  eventTitle: string;
  dateStr: string;
  timeStr: string;
  location: string;
}

export function FloatingActionBar({
  eventId,
  userId,
  isRegistered,
  paymentStatus,
  isFull,
  price,
  isPastEvent,
  isCreator,
  eventTitle,
  dateStr,
  timeStr,
  location,
}: FloatingActionBarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const registerCard = document.getElementById("register-card");
    if (!registerCard) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 카드가 화면에서 벗어나면 플로팅 바 표시
          setIsVisible(!entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(registerCard);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[90] bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden shadow-lg transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex items-center gap-2 max-w-md mx-auto">
        {/* 공유 버튼 (아이콘만) */}
        <div className="shrink-0">
          <EventShareButton
            title={eventTitle}
            description={`일시: ${dateStr} ${timeStr}\n장소: ${location || "장소 미정"}`}
            variant="outline"
            size="icon"
            className="h-10 w-10"
          />
        </div>

        {/* 신청 버튼 (꽉 차게) */}
        <div className="flex-1">
          {isPastEvent ? (
            <Button className="w-full bg-slate-100 text-slate-400 h-10 text-sm" disabled>
              종료됨
            </Button>
          ) : isCreator ? (
            <Link href={`/events/${eventId}/manage`} className="block w-full">
              <Button className="w-full bg-slate-900 text-white hover:bg-slate-800 h-10 text-sm font-semibold">
                관리하기
              </Button>
            </Link>
          ) : (
            <RegisterButton
              eventId={eventId}
              userId={userId}
              isRegistered={isRegistered}
              paymentStatus={paymentStatus}
              isFull={isFull}
              price={price}
            />
          )}
        </div>
      </div>
    </div>
  );
}


import { createClient } from "@/lib/supabase/server";
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Link from "next/link";
import { FloatingActionBar } from "@/components/floating-action-bar";
import { getReviewsByEvent } from "@/lib/queries/posts";
import { getReviewsForHost } from "@/lib/queries/reviews";
import { ReviewModal } from "@/components/reviews/review-modal";
import { ReviewCard } from "@/components/reviews/review-card";
import { EventDetailHero } from "@/components/event-detail-hero";
import { ClickableAvatar } from "@/components/ui/clickable-avatar";

export default async function EventDetailContent({
  eventId,
  basePath = '/events'
}: {
  eventId: string;
  basePath?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. 이벤트 정보 조회
  let event;
  try {
    const { data, error } = await supabase
      .from("events")
      .select(`
        *,
        profiles:created_by (
          id,
          full_name,
          avatar_url,
          email,
          bio,
          tagline,
          company,
          position
        )
      `)
      .eq("id", eventId)
      .single();

    if (error || !data) notFound();
    event = data;
  } catch (error) { notFound(); }

  // 2. 관련 정보 병렬 조회
  const [userRegResult, attendeesResult, reviewsResult, hostReviewsResult] = await Promise.all([
    user
      ? supabase
        .from("event_registrations")
        .select("id, payment_status, status, waitlist_position")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("event_registrations")
      .select(`id, user_id, guest_name, status, profiles:user_id (id, full_name, avatar_url)`)
      .eq("event_id", eventId)
      .eq("status", "confirmed"),
    getReviewsByEvent(supabase, eventId),
    getReviewsForHost(supabase, event.created_by, 10),
  ]);

  const userRegistration = userRegResult.data;
  const attendees = attendeesResult.data || [];
  const reviews = reviewsResult;
  const hostOtherReviews = hostReviewsResult.filter(r => r.event_id !== eventId);

  // 3. 상태 계산
  const isRegistered = !!userRegistration;
  const registrationStatus = userRegistration?.status as "confirmed" | "waitlist" | undefined;
  const waitlistPosition = userRegistration?.waitlist_position as number | null | undefined;
  const currentCount = attendees.length;

  const maxCount = event.max_participants;
  const isFull = maxCount && currentCount >= maxCount;
  const isCreator = user && event.created_by === user.id;

  const now = new Date();
  const eventStartDate = new Date(event.event_date);
  const eventEndDate = event.end_date
    ? new Date(event.end_date)
    : new Date(eventStartDate.getTime() + 3 * 60 * 60 * 1000);

  const isPastEvent = eventEndDate < now;
  const isCompleted = event.status === 'completed';

  const dateStr = eventStartDate.toLocaleDateString("ko-KR", { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short', timeZone: 'Asia/Seoul' });
  const timeStr = eventStartDate.toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: 'Asia/Seoul' });

  const hostProfile = Array.isArray(event.profiles) ? event.profiles[0] : event.profiles;
  const hostName = hostProfile?.full_name || "알 수 없음";
  const hostAvatar = hostProfile?.avatar_url;


  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* 상단 네비게이션 */}
      <div className="mb-8 flex items-center justify-between">
        <Link href="/e" className="group flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
          <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 group-hover:border-slate-300 shadow-sm transition-all">
            <ChevronLeft className="h-4 w-4" />
          </div>
          이벤트 목록
        </Link>
      </div>

      <div className="flex flex-col gap-16">

        {/* 1. Hero 섹션 (포스터, 정보, 등록) */}
        <EventDetailHero
          event={event}
          hostName={hostName}
          hostAvatar={hostAvatar}
          hostProfile={hostProfile}
          dateStr={dateStr}
          timeStr={timeStr}
          currentCount={currentCount}
          maxCount={maxCount}
          isFull={!!isFull}
          isPastEvent={isPastEvent}
          isCompleted={isCompleted}
          isCreator={!!isCreator}
          isRegistered={isRegistered}
          userRegistration={userRegistration}
          eventId={eventId}
          basePath={basePath}
          userId={user?.id}
          registrationStatus={registrationStatus}
          waitlistPosition={waitlistPosition}
          attendees={attendees}
          description={event.description}
        />

        {/* 2. 후기 섹션 */}
        <div className="w-full">
           <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-3">
             <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
               참가자 후기
               <span className="text-slate-400 font-normal text-base">({reviews ? reviews.length : 0})</span>
             </h3>
             {user && <ReviewModal userId={user.id} eventId={eventId} />}
           </div>

           {reviews && reviews.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {reviews.map((review: any) => (
                 <ReviewCard key={review.id} review={review} className="border border-slate-200 shadow-none hover:shadow-md transition-all" />
               ))}
             </div>
           ) : (
             <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-slate-500">아직 작성된 후기가 없습니다.</p>
             </div>
           )}
        </div>

      </div>

      {/* 모바일 하단 고정 바 */}
      <FloatingActionBar
        eventId={eventId}
        userId={user?.id}
        isRegistered={isRegistered}
        paymentStatus={userRegistration?.payment_status}
        isFull={!!isFull}
        price={event.price || 0}
        isPastEvent={isPastEvent}
        isCreator={!!isCreator}
        eventTitle={event.title}
        dateStr={dateStr}
        timeStr={timeStr}
        location={event.location || ""}
        registrationStatus={registrationStatus}
        waitlistPosition={waitlistPosition}
      />
    </div>
  );
}

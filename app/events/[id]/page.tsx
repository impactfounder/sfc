import { createClient } from "@/lib/supabase/server";
import { notFound } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Users, Settings, ChevronLeft, Info, CheckCircle2, AlertCircle, Share2, Ticket, ShieldCheck } from 'lucide-react';
import { RegisterButton } from "@/components/register-button";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // 이벤트 정보 조회
  const { data: event } = await supabase
    .from("events")
    .select(`
      *,
      profiles:created_by (
        id,
        full_name,
        avatar_url,
        email,
        bio
      )
    `)
    .eq("id", id)
    .single();

  if (!event) {
    notFound();
  }

  // 사용자 등록 여부 및 포인트 조회
  let userRegistration = null;
  let userPoints = 0;
  if (user) {
    const [registrationResult, profileResult] = await Promise.all([
      supabase
        .from("event_registrations")
        .select("id")
        .eq("event_id", id)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("profiles")
        .select("points")
        .eq("id", user.id)
        .single(),
    ]);
    userRegistration = registrationResult.data;
    userPoints = profileResult.data?.points || 0;
  }

  // 참석자 수 조회
  const { count: attendeesCount } = await supabase
    .from("event_registrations")
    .select("*", { count: "exact", head: true })
    .eq("event_id", id);

  // 참석자 목록 조회
  const { data: attendeesData } = await supabase
    .from("event_registrations")
    .select(`
      id,
      user_id,
      guest_name,
      profiles:user_id (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq("event_id", id);

  const attendees = attendeesData || [];

  const isRegistered = !!userRegistration;
  const isPastEvent = new Date(event.event_date) < new Date();
  const isFull = event.max_participants && attendeesCount && attendeesCount >= event.max_participants;
  const isCreator = user && event.created_by === user.id;
  const isCompleted = event.status === 'completed';

  // 날짜/시간 포맷팅
  const eventDate = new Date(event.event_date);
  const dateStr = eventDate.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
  const timeStr = eventDate.toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
  });

  // [공통 컴포넌트] 카드 헤더
  const CardHeader = ({ icon: Icon, title, rightElement }: { icon: React.ComponentType<{ className?: string }>, title: string, rightElement?: React.ReactNode }) => (
    <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-md bg-slate-50 text-slate-500 border border-slate-100">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
      </div>
      {rightElement}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        
        {/* 상단 네비게이션 */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/events" className="group flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 group-hover:border-slate-300 shadow-sm transition-all">
              <ChevronLeft className="h-4 w-4" />
            </div>
            이벤트 목록
          </Link>
          
          {isCreator && (
            <Link href={`/events/${id}/manage`}>
              <Button variant="outline" size="sm" className="bg-white border-slate-300 hover:bg-slate-50 text-slate-700">
                <Settings className="mr-2 h-3.5 w-3.5" />
                관리자 설정
              </Button>
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-8">
          
          {/* [ROW 1] */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Row 1 - Left (8) */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
              <div className="relative aspect-video w-full bg-slate-100">
                <img
                  src={event.thumbnail_url || "/placeholder.svg"}
                  alt={event.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  {isCompleted ? (
                    <Badge className="bg-slate-800 text-white border-none px-3 py-1.5 text-sm font-medium">종료됨</Badge>
                  ) : isPastEvent ? (
                    <Badge variant="secondary" className="bg-slate-200 text-slate-700 border-none px-3 py-1.5 text-sm font-medium">기간 만료</Badge>
                  ) : isFull ? (
                    <Badge variant="destructive" className="px-3 py-1.5 text-sm font-medium">마감임박</Badge>
                  ) : (
                    <Badge className="bg-green-600 hover:bg-green-700 text-white border-none px-3 py-1.5 text-sm font-medium shadow-sm">
                      모집중
                    </Badge>
                  )}
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <h1 className="text-3xl font-bold text-slate-900 leading-tight mb-8">
                  {event.title}
                </h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-slate-900 shadow-sm border border-slate-100">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date & Time</p>
                      <p className="text-base font-bold text-slate-900">{dateStr}</p>
                      <p className="text-sm text-slate-600 font-medium">{timeStr}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-slate-900 shadow-sm border border-slate-100">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Location</p>
                      <p className="text-base font-bold text-slate-900">{event.location}</p>
                      <p className="text-sm text-slate-500">현장 진행</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 1 - Right (4) */}
            <Card className="lg:col-span-4 border-slate-200 shadow-md bg-white h-full">
              <CardContent className="p-6">
                <CardHeader 
                  icon={Ticket} 
                  title="참가 신청" 
                  rightElement={
                    <Badge variant="outline" className="font-medium text-slate-500 border-slate-200 bg-slate-50">
                      Free
                    </Badge>
                  }
                />

                <div className="mb-8">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm text-slate-500 font-medium">현재 모집 현황</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-slate-900">{attendeesCount}</span>
                      <span className="text-slate-400 text-sm font-medium ml-1">
                        / {event.max_participants ? event.max_participants : '∞'}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ease-out ${isFull ? 'bg-red-500' : 'bg-slate-900'}`}
                      style={{ width: `${Math.min(100, ((attendeesCount || 0) / (event.max_participants || 1)) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {isPastEvent ? (
                    <Button className="w-full bg-slate-100 text-slate-500 hover:bg-slate-200 border-0 h-12 text-base font-medium" disabled>
                      <AlertCircle className="mr-2 h-5 w-5" />
                      이벤트가 종료되었습니다
                    </Button>
                  ) : isCreator ? (
                    <Button className="w-full border-dashed border-2 border-slate-200 text-slate-500 hover:bg-slate-50 h-12 text-base font-medium" disabled variant="outline">
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      내가 만든 이벤트입니다
                    </Button>
                  ) : (
                    <RegisterButton
                      eventId={event.id}
                      userId={user?.id}
                      isRegistered={isRegistered}
                      isFull={!!isFull}
                      userPoints={userPoints}
                      eventPointCost={event.point_cost || undefined}
                    />
                  )}
                  
                  {!isRegistered && !isPastEvent && !isCreator && (
                    <p className="text-xs text-center text-slate-400 mt-4 font-medium">
                      신청 시 <span className="text-slate-900 font-bold underline underline-offset-2">10 포인트</span> 적립 🎁
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* [ROW 2] */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Row 2 - Left (8) : 상세 내용 */}
            <Card className="lg:col-span-8 border-slate-200 shadow-sm h-full">
              <CardContent className="p-6 sm:p-8">
                <CardHeader icon={Info} title="상세 내용" />
                <div className="prose prose-slate max-w-none prose-headings:font-bold prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-slate-900">
                  <p className="whitespace-pre-wrap leading-8">{event.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Row 2 - Right (4) : 호스트 소개 */}
            <Card className="lg:col-span-4 border-slate-200 shadow-sm bg-white h-full">
              <CardContent className="p-6 flex flex-col h-full">
                <CardHeader icon={ShieldCheck} title="호스트 소개" />
                
                <div className="flex gap-4 mb-6 flex-1 items-start">
                  <Avatar className="h-12 w-12 border border-slate-100 shrink-0">
                    <AvatarImage src={event.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="bg-slate-900 text-white font-bold">
                      {event.profiles?.full_name?.[0] || "H"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 flex flex-col justify-center" style={{ minHeight: '48px' }}>
                    <p className="text-xl font-bold text-slate-900 truncate">
                      {event.profiles?.full_name || "알 수 없음"}
                    </p>
                    {event.profiles?.bio && (
                      <p className="text-sm text-slate-600 mt-3 leading-relaxed line-clamp-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        {event.profiles.bio}
                      </p>
                    )}
                  </div>
                </div>

                <Separator className="mb-4 bg-slate-100" />

                <Button variant="outline" className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 h-11 font-medium transition-all shadow-sm hover:shadow">
                  <Share2 className="mr-2 h-4 w-4" />
                  이 이벤트 공유하기
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* [ROW 3] 참석자 목록 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <Card className="lg:col-span-8 border-slate-200 shadow-sm">
              <CardContent className="p-6 sm:p-8">
                <CardHeader 
                  icon={Users} 
                  title="참석자 멤버" 
                  rightElement={
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      {attendeesCount}명 참여
                    </span>
                  }
                />
                
                {attendees && attendees.length > 0 ? (
                  <div className="flex flex-wrap gap-4">
                    {attendees.map((attendee: { id?: string; profiles?: { full_name?: string; avatar_url?: string } | null; guest_name?: string }, index: number) => {
                      const profile = attendee.profiles as { full_name?: string; avatar_url?: string } | null | undefined;
                      const name = profile?.full_name || attendee.guest_name || "익명";
                      return (
                        <div key={attendee.id || index} className="flex flex-col items-center gap-2 w-16 group cursor-default">
                          <Avatar className="h-14 w-14 border-2 border-white shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:border-slate-200">
                            <AvatarImage src={profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-slate-100 text-slate-500 font-bold">
                              {name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-slate-600 truncate w-full text-center font-medium group-hover:text-slate-900">
                            {name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-slate-500 text-sm">아직 참석자가 없습니다.<br/>첫 번째 멤버가 되어보세요!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}


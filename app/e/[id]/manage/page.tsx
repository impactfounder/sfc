import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ChevronLeft, Users, Calendar, MapPin, UserPlus, Download, Mail } from 'lucide-react';
import { AddGuestForm } from "@/components/add-guest-form";
import { ExportCSVButton } from "@/components/export-csv-button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { isMasterAdmin } from "@/lib/utils";
import { getEventShortUrl } from "@/lib/utils/event-url";

export default async function ManageEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 짧은 코드인 경우 UUID로 변환
  let eventId = id;
  if (id.length === 6) {
    // URL 파싱 (예: 010194 -> 1월 1일, 접두사 94)
    const targetMonth = parseInt(id.substring(0, 2), 10);
    const targetDay = parseInt(id.substring(2, 4), 10);
    const idSuffix = id.substring(4, 6).toLowerCase();
    const orderNumber = parseInt(idSuffix, 10); // 순서번호 방식 대비

    // 여러 연도에서 해당 날짜의 이벤트만 조회
    const currentYear = new Date().getFullYear();
    const yearsToCheck = [currentYear, currentYear - 1, currentYear + 1];
    let allDateEvents: any[] = [];

    for (const year of yearsToCheck) {
      const monthStr = String(targetMonth).padStart(2, '0');
      const dayStr = String(targetDay).padStart(2, '0');
      const startDate = `${year}-${monthStr}-${dayStr}T00:00:00`;
      const endDate = `${year}-${monthStr}-${dayStr}T23:59:59`;

      const { data: yearEvents } = await supabase
        .from("events")
        .select("id, event_date")
        .gte("event_date", startDate)
        .lte("event_date", endDate)
        .order("created_at", { ascending: true });

      if (yearEvents && yearEvents.length > 0) {
        allDateEvents.push(...yearEvents);
      }
    }

    if (allDateEvents.length === 0) {
      notFound();
    }

    // ID 앞 2자리가 일치하는 이벤트 찾기 (우선)
    const matchedEvent = allDateEvents.find((event: any) => {
      const eventIdPrefix = event.id.substring(0, 2).toLowerCase();
      return eventIdPrefix === idSuffix;
    });

    if (matchedEvent) {
      eventId = matchedEvent.id;
    } else if (allDateEvents.length >= orderNumber) {
      // 못 찾았다면 '순서번호' 방식(구버전 URL)으로 한 번 더 찾기
      eventId = allDateEvents[orderNumber - 1].id;
    } else {
      notFound();
    }
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (!event) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single();

  const isCreator = event.created_by === user.id;
  const isMaster = profile ? isMasterAdmin(profile.role, profile.email) : false;

  if (!isCreator && !isMaster) {
    redirect('/e');
  }

  const { data: registrations } = await supabase
    .from("event_registrations")
    .select(`
      *,
      profiles:user_id (
        id,
        full_name,
        avatar_url,
        email
      )
    `)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  const customFields: any[] = [];
  const responseMap: Record<string, Record<string, string>> = {};

  const shortUrl = await getEventShortUrl(event.id, event.event_date, supabase);

  // 날짜 포맷팅
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
    hour12: true,
  });

  const currentCount = registrations?.length || 0;
  const maxCount = event.max_participants;

  return (
    <div className="w-full">
      {/* 상단 네비게이션 */}
      <div className="mb-6 flex items-center justify-between">
        <Link href={shortUrl} className="group flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
          <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 group-hover:border-slate-300 shadow-sm transition-all">
            <ChevronLeft className="h-4 w-4" />
          </div>
          이벤트로 돌아가기
        </Link>
      </div>

      {/* 헤더 섹션 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 text-white">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">참석자 관리</h1>
            <p className="text-sm text-slate-500">{event.title}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 메인 콘텐츠 */}
        <div className="lg:col-span-8">
          {/* 참가자 목록 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-500" />
                참가자 목록
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                  {currentCount}명 {maxCount && `/ ${maxCount}명`}
                </span>
                {registrations && registrations.length > 0 && (
                  <ExportCSVButton
                    registrations={registrations || []}
                    customFields={customFields}
                    responseMap={responseMap}
                    eventTitle={event.title}
                  />
                )}
              </div>
            </div>

            <Card className="border-slate-200 shadow-sm bg-white overflow-hidden rounded-2xl lg:min-h-[320px]">
              <CardContent className="p-0 h-full">
                {registrations && registrations.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {registrations.map((reg: any, index: number) => {
                      const profile = Array.isArray(reg.profiles) ? reg.profiles[0] : reg.profiles;
                      const name = profile?.full_name || reg.guest_name || "익명";
                      const email = profile?.email || reg.guest_contact || "-";
                      const avatarUrl = profile?.avatar_url;
                      const isGuest = !reg.user_id;

                      return (
                        <div key={reg.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-slate-200">
                              {avatarUrl && <AvatarImage src={avatarUrl} />}
                              <AvatarFallback className="bg-slate-100 text-slate-600 font-semibold text-sm">
                                {name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900">{name}</span>
                                {isGuest && (
                                  <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 border-amber-200 text-amber-600 bg-amber-50">
                                    게스트
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-slate-500">
                                <Mail className="w-3 h-3" />
                                <span>{email}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-400">
                              {new Date(reg.created_at).toLocaleDateString("ko-KR", {
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                            {event.price && event.price > 0 && (
                              <Badge
                                variant={reg.payment_status === 'paid' ? 'default' : 'secondary'}
                                className={`text-xs mt-1 ${
                                  reg.payment_status === 'paid'
                                    ? 'bg-green-100 text-green-700 border-green-200'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {reg.payment_status === 'paid' ? '결제완료' : '미결제'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <Users className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">아직 참가자가 없습니다</h3>
                    <p className="text-slate-500 text-sm">이벤트를 공유하여 참가자를 모집해보세요!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 사이드바 */}
        <div className="lg:col-span-4">
          {/* 이벤트 정보 */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-500" />
              이벤트 정보
            </h2>
            <Card className="border-slate-200 shadow-sm bg-white rounded-2xl lg:min-h-[320px]">
              <CardContent className="p-5">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">일시</p>
                    <p className="font-medium text-slate-900">{dateStr}</p>
                    <p className="text-sm text-slate-600">{timeStr}</p>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">장소</p>
                      <p className="font-medium text-slate-900">{event.location}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">참가 현황</p>
                    <p className="font-medium text-slate-900">
                      {currentCount}명 {maxCount ? `/ ${maxCount}명` : '(제한 없음)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 모집 현황 바 */}
              {maxCount && (
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500">모집 현황</span>
                    <span className="font-semibold text-slate-900">
                      {Math.round((currentCount / maxCount) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        currentCount >= maxCount ? 'bg-red-500' : 'bg-slate-900'
                      }`}
                      style={{ width: `${Math.min(100, (currentCount / maxCount) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 게스트 추가 */}
      <div className="mt-8 lg:max-w-[66%]">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-slate-500" />
          게스트 추가
        </h2>
        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden rounded-2xl">
          <CardContent className="p-6">
            <p className="text-sm text-slate-500 mb-4">
              계정이 없는 참가자를 직접 추가할 수 있습니다.
            </p>
            <AddGuestForm eventId={eventId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Users } from 'lucide-react';
import { AddGuestForm } from "@/components/add-guest-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExportCSVButton } from "@/components/export-csv-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
    // 짧은 코드 파싱 및 이벤트 찾기
    const { buildEventQueryFromShortCode } = await import("@/lib/utils/event-url");
    const query = buildEventQueryFromShortCode(id);
    if (!query) {
      notFound();
    }

    const { month, day, orderNumber } = query;
    const currentYear = new Date().getFullYear();
    let allMatchingEvents: any[] = [];

    for (let yearOffset = 0; yearOffset < 10; yearOffset++) {
      const searchYear = currentYear - yearOffset;
      const searchDate = new Date(searchYear, month - 1, day);
      const startOfDay = new Date(searchDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(searchDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: yearEvents } = await supabase
        .from("events")
        .select("id, event_date, created_at")
        .gte("event_date", startOfDay.toISOString())
        .lte("event_date", endOfDay.toISOString())
        .order("created_at", { ascending: true });

      if (yearEvents && yearEvents.length > 0) {
        allMatchingEvents.push(...yearEvents);
      }
    }

    allMatchingEvents.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateA - dateB;
    });

    if (allMatchingEvents.length >= orderNumber) {
      eventId = allMatchingEvents[orderNumber - 1].id;
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

  // 커스텀 필드/응답이 없는 경우를 대비해 기본값을 준비합니다.
  const customFields: any[] = [];
  const responseMap: Record<string, Record<string, string>> = {};

  const shortUrl = await getEventShortUrl(event.id, event.event_date, supabase);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href={shortUrl} className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            이벤트로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">{event.title}</h1>
          <p className="mt-2 text-slate-600">이벤트 관리</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>참가자 목록</span>
                  <span className="text-sm font-normal text-slate-500">
                    {registrations?.length || 0}명
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {registrations && registrations.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <ExportCSVButton
                        registrations={registrations || []}
                        customFields={customFields}
                        responseMap={responseMap}
                        eventTitle={event.title}
                      />
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>이름</TableHead>
                          <TableHead>이메일</TableHead>
                          <TableHead>신청일</TableHead>
                          <TableHead>상태</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {registrations.map((reg: any) => (
                          <TableRow key={reg.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={reg.profiles?.avatar_url} />
                                  <AvatarFallback>
                                    {reg.profiles?.full_name?.[0] || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{reg.profiles?.full_name || "익명"}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-600">
                              {reg.profiles?.email || "-"}
                            </TableCell>
                            <TableCell className="text-slate-600">
                              {new Date(reg.created_at).toLocaleDateString("ko-KR")}
                            </TableCell>
                            <TableCell>
                              <Badge variant={reg.status === 'confirmed' ? 'default' : 'secondary'}>
                                {reg.status === 'confirmed' ? '확정' : '대기'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-8">아직 참가자가 없습니다.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>게스트 추가</CardTitle>
              </CardHeader>
              <CardContent>
                <AddGuestForm eventId={eventId} />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>이벤트 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">날짜</p>
                  <p className="font-medium">
                    {new Date(event.event_date).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                {event.location && (
                  <div>
                    <p className="text-sm text-slate-500">장소</p>
                    <p className="font-medium">{event.location}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-slate-500">최대 인원</p>
                  <p className="font-medium">
                    {event.max_participants || "제한 없음"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">현재 참가자</p>
                  <p className="font-medium">{registrations?.length || 0}명</p>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}


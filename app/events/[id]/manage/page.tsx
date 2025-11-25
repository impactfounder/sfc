import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Users, CheckCircle, Download } from 'lucide-react';
import { CompleteEventButton } from "@/components/complete-event-button";
import { AddGuestForm } from "@/components/add-guest-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExportCSVButton } from "@/components/export-csv-button";

export default async function ManageEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (!event) {
    notFound();
  }

  if (event.created_by !== user.id) {
    redirect(`/events/${id}`);
  }

  // 커스텀 필드 불러오기 (테이블 헤더 구성용)
  const { data: customFields } = await supabase
    .from("event_registration_fields")
    .select("*")
    .eq("event_id", id)
    .order("order_index", { ascending: true });

  // 게스트 등록과 사용자 등록을 모두 가져오기 (Nested Select로 응답도 함께)
  const { data: registrations } = await supabase
    .from("event_registrations")
    .select(`
      *,
      profiles:user_id (
        id,
        full_name,
        email
      ),
      responses:event_registration_responses (
        field_id,
        response_value
      )
    `)
    .eq("event_id", id)
    .order("registered_at", { ascending: true });

  // 응답을 registration_id와 field_id로 매핑 (Nested Select 결과 처리)
  const responseMap: Record<string, Record<string, string>> = {};
  registrations?.forEach(registration => {
    if (registration.responses && Array.isArray(registration.responses)) {
      responseMap[registration.id] = {};
      registration.responses.forEach((response: any) => {
        if (response.field_id && response.response_value) {
          responseMap[registration.id][response.field_id] = response.response_value;
        }
      });
    }
  });

  const isPastEvent = new Date(event.event_date) < new Date();
  const isCompleted = event.status === 'completed';

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href={`/events/${id}`}>
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              이벤트로 돌아가기
            </Button>
          </Link>
        </div>

        <Card className="mb-6 border-slate-200">
          <CardHeader>
            <CardTitle className="text-2xl">{event.title}</CardTitle>
            <p className="text-sm text-slate-600">
              {new Date(event.event_date).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </CardHeader>
          <CardContent>
            {isPastEvent && !isCompleted && (
              <div className="rounded-lg bg-amber-50 p-4">
                <p className="mb-3 text-sm text-amber-800">
                  이벤트가 종료되었습니다. 이벤트를 완료 처리하면 100 포인트를 받습니다.
                </p>
                <CompleteEventButton eventId={id} userId={user.id} />
              </div>
            )}
            {isCompleted && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">이벤트가 완료되었습니다</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 참석자 목록 (테이블) */}
          <div className="lg:col-span-3">
            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    참석자 관리 ({registrations?.length || 0}명)
                  </CardTitle>
                  {registrations && registrations.length > 0 && (
                    <ExportCSVButton
                      registrations={registrations}
                      customFields={customFields || []}
                      responseMap={responseMap}
                      eventTitle={event.title}
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {registrations && registrations.length > 0 ? (
                  <div className="overflow-x-auto max-w-full">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="font-semibold text-slate-900 whitespace-nowrap sticky left-0 bg-slate-50 z-10">이름</TableHead>
                          <TableHead className="font-semibold text-slate-900 whitespace-nowrap">이메일/연락처</TableHead>
                          <TableHead className="font-semibold text-slate-900 whitespace-nowrap">신청일</TableHead>
                          <TableHead className="font-semibold text-slate-900 whitespace-nowrap">게스트 여부</TableHead>
                          {customFields?.map((field) => (
                            <TableHead key={field.id} className="font-semibold text-slate-900 whitespace-nowrap min-w-[150px]">
                              {field.field_name}
                              {field.is_required && <span className="text-red-500 ml-1">*</span>}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {registrations.map((registration) => {
                          const isGuest = !registration.user_id;
                          const displayName = isGuest
                            ? (registration as { guest_name?: string }).guest_name || "게스트"
                            : (registration.profiles as any)?.full_name || "익명";
                          const displayContact = isGuest
                            ? (registration as { guest_contact?: string }).guest_contact
                            : (registration.profiles as any)?.email;

                          return (
                            <TableRow key={registration.id} className="hover:bg-slate-50">
                              <TableCell className="font-medium text-slate-900 whitespace-nowrap sticky left-0 bg-white z-10">
                                {displayName}
                              </TableCell>
                              <TableCell className="text-slate-600 whitespace-nowrap">
                                {displayContact || '-'}
                              </TableCell>
                              <TableCell className="text-slate-600 whitespace-nowrap">
                                {new Date(registration.registered_at).toLocaleDateString("ko-KR", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </TableCell>
                              <TableCell className="text-slate-600 whitespace-nowrap">
                                {isGuest ? (
                                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                                    게스트
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
                                    회원
                                  </span>
                                )}
                              </TableCell>
                              {customFields?.map((field) => {
                                const response = responseMap[registration.id]?.[field.id] || '-';
                                return (
                                  <TableCell key={field.id} className="text-slate-600 whitespace-nowrap">
                                    {response}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500">
                    아직 참석 신청자가 없습니다
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 수동 등록 폼 */}
          <div className="lg:col-span-1">
            <AddGuestForm eventId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}

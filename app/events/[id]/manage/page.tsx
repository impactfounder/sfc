import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Users } from 'lucide-react';
import { CompleteEventButton } from "@/components/complete-event-button";
import { AddGuestForm } from "@/components/add-guest-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExportCSVButton } from "@/components/export-csv-button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

  // 이벤트 정보
  const { data: event } = await supabase
    .from("events")
    .select("id, title, created_by, status")
    .eq("id", id)
    .single();

  if (!event) notFound();
  if (event.created_by !== user.id) redirect(`/events/${id}`);

  // 커스텀 필드
  const { data: customFields } = await supabase
    .from("event_registration_fields")
    .select("id, field_name, field_type, order_index")
    .eq("event_id", id)
    .order("order_index", { ascending: true });

  // 참가자 목록
  const { data: registrations } = await supabase
    .from("event_registrations")
    .select(`
      *,
      profiles:user_id (id, full_name, email),
      responses:event_registration_responses (field_id, response_value)
    `)
    .eq("event_id", id)
    .order("registered_at", { ascending: true });

  // 답변 매핑
  const responseMap: Record<string, Record<string, string>> = {};
  registrations?.forEach(reg => {
    if (reg.responses) {
      responseMap[reg.id] = {};
      (reg.responses as any[]).forEach((res: any) => {
        if (res.field_id && res.response_value) {
          responseMap[reg.id][res.field_id] = res.response_value;
        }
      });
    }
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 md:p-8 pb-24">
      <div className="mx-auto max-w-7xl">
        
        {/* 헤더 */}
        <div className="mb-8 flex items-center justify-between w-full">
          <div className="flex flex-col gap-1">
            <Link href={`/events/${id}`} className="flex items-center text-slate-500 hover:text-slate-900 transition-colors font-medium text-sm mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              이벤트 페이지로 돌아가기
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">{event.title}</h1>
            <p className="text-slate-500 text-sm">참석자 현황을 관리합니다</p>
          </div>
          
          <div className="shrink-0">
            {event.status === 'upcoming' && (
              <CompleteEventButton eventId={id} userId={user.id} />
            )}
          </div>
        </div>

        {/* 메인 컨텐츠 (Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 좌측: 참석자 리스트 (8칸) */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      참석자 목록
                      <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                        {registrations?.length || 0}명
                      </span>
                    </CardTitle>
                  </div>
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
              <CardContent className="p-0">
                {registrations && registrations.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                          <TableHead className="w-[20%] font-semibold text-xs text-slate-500 pl-6">이름</TableHead>
                          <TableHead className="w-[25%] font-semibold text-xs text-slate-500">연락처</TableHead>
                          <TableHead className="w-[15%] font-semibold text-xs text-slate-500">구분</TableHead>
                          {customFields?.map((field) => (
                            <TableHead key={field.id} className="font-semibold text-xs text-slate-500 min-w-[150px]">
                              {field.field_name}
                            </TableHead>
                          ))}
                          <TableHead className="w-[15%] font-semibold text-xs text-slate-500 text-right pr-6">신청일시</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {registrations.map((reg) => {
                          const isGuest = !reg.user_id;
                          const name = isGuest ? (reg as any).guest_name : (reg.profiles as any)?.full_name;
                          const contact = isGuest ? (reg as any).guest_contact : (reg.profiles as any)?.email;

                          return (
                            <TableRow key={reg.id} className="hover:bg-slate-50/80 border-b border-slate-50 last:border-0">
                              <TableCell className="font-medium text-slate-900 pl-6 py-4">
                                {name || "이름 없음"}
                              </TableCell>
                              <TableCell className="text-slate-500 text-sm">
                                {contact || "-"}
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-md text-[11px] font-medium border ${isGuest ? "bg-slate-50 text-slate-500 border-slate-200" : "bg-blue-50 text-blue-600 border-blue-100"}`}>
                                  {isGuest ? "게스트" : "회원"}
                                </span>
                              </TableCell>
                              
                              {/* 답변 필드 */}
                              {customFields?.map((field) => {
                                const answer = responseMap[reg.id]?.[field.id] || "-";
                                const isLong = answer.length > 15;

                                return (
                                  <TableCell key={field.id} className="text-slate-600 text-sm">
                                    {isLong ? (
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <button className="text-left hover:text-blue-600 hover:underline max-w-[150px] truncate block text-slate-500">
                                            {answer}
                                          </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 p-4 text-sm bg-white shadow-xl border-slate-200 rounded-xl">
                                          <div className="font-semibold mb-2 text-slate-900 text-xs">{field.field_name}</div>
                                          <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{answer}</p>
                                        </PopoverContent>
                                      </Popover>
                                    ) : (
                                      <span className="block max-w-[150px] truncate">{answer}</span>
                                    )}
                                  </TableCell>
                                );
                              })}
                              
                              <TableCell className="text-right text-slate-400 text-xs pr-6">
                                {new Date(reg.registered_at).toLocaleString("ko-KR", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-20 text-center flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                      <Users className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">아직 신청자가 없습니다</p>
                    <p className="text-slate-400 text-sm">이벤트를 공유하여 참여를 유도해보세요</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 우측: 수동 등록 폼 (4칸) */}
          <div className="lg:col-span-4">
            <div className="sticky top-6">
              <AddGuestForm eventId={id} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

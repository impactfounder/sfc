"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

type Registration = {
  id: string;
  user_id: string | null;
  registered_at: string;
  guest_name?: string | null;
  guest_contact?: string | null;
  profiles?: {
    full_name?: string | null;
    email?: string | null;
  } | null;
};

type CustomField = {
  id: string;
  field_name: string;
  field_type: string;
  field_options: string[] | null;
  is_required: boolean;
};

type ExportCSVButtonProps = {
  registrations: Registration[];
  customFields: CustomField[];
  responseMap: Record<string, Record<string, string>>;
  eventTitle: string;
};

export function ExportCSVButton({
  registrations,
  customFields,
  responseMap,
  eventTitle,
}: ExportCSVButtonProps) {
  const handleExport = () => {
    // CSV 헤더 생성
    const headers = ['이름', '이메일/연락처', '신청일', '게스트 여부', ...customFields.map(f => f.field_name)];
    
    // CSV 데이터 생성
    const rows = registrations.map((registration) => {
      const isGuest = !registration.user_id;
      const name = isGuest
        ? (registration.guest_name || "게스트")
        : ((registration.profiles as any)?.full_name || "익명");
      const contact = isGuest
        ? (registration.guest_contact || '')
        : ((registration.profiles as any)?.email || '');
      const date = new Date(registration.registered_at).toLocaleString("ko-KR");
      const guestStatus = isGuest ? '게스트' : '회원';
      
      const fieldResponses = customFields.map(field => {
        const response = responseMap[registration.id]?.[field.id] || '';
        // CSV에서 쉼표와 따옴표 처리
        return `"${String(response).replace(/"/g, '""')}"`;
      });
      
      return [name, contact, date, guestStatus, ...fieldResponses];
    });
    
    // CSV 문자열 생성
    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // BOM 추가 (한글 깨짐 방지)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // 다운로드
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${eventTitle}_참가자_목록_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      CSV 다운로드
    </Button>
  );
}


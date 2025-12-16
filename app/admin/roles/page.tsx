import { requireMaster } from "@/lib/auth/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Crown } from 'lucide-react';
import { RoleManager } from "@/components/role-manager";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";

export default async function RolesManagementPage() {
  const { supabase, user } = await requireMaster();

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .neq("id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 pt-20 md:pt-8">
      <div className="mx-auto max-w-7xl">
        <AdminBreadcrumb items={[{ label: "관리자 지정" }]} />

        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Crown className="h-8 w-8 text-amber-500" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                관리자 지정
              </h1>
              <p className="mt-2 text-slate-600">
                MASTER 전용: 다른 회원에게 관리자 권한 부여
              </p>
            </div>
          </div>
        </div>

        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">관리자 권한 안내</p>
                <ul className="list-disc list-inside space-y-1 text-amber-700">
                  <li>게시판 카테고리 생성, 수정, 삭제</li>
                  <li>회원 목록 조회 및 관리</li>
                  <li>관리자 대시보드 접근</li>
                </ul>
                <p className="mt-2 font-medium">MASTER 관리자만 다른 관리자를 지정할 수 있습니다.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>회원 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users && users.length > 0 ? (
                users.map((member) => (
                  <RoleManager key={member.id} user={member} />
                ))
              ) : (
                <div className="py-12 text-center text-slate-500">
                  회원이 없습니다
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

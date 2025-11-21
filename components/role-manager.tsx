"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Shield, ShieldCheck, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function RoleManager({ user }: { user: any }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleToggleAdmin = async () => {
    setIsLoading(true);
    try {
      const newRole = user.role === 'admin' ? 'member' : 'admin';
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", user.id);

      if (!error) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update role:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = user.role === 'admin';

  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-lg font-medium text-slate-700">
          {user.full_name?.[0] || "U"}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-slate-900">
              {user.full_name || "익명"}
            </p>
            {isAdmin && (
              <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                <ShieldCheck className="h-3 w-3" />
                관리자
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600">{user.email}</p>
        </div>
      </div>
      <Button
        variant={isAdmin ? "outline" : "default"}
        size="sm"
        onClick={handleToggleAdmin}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isAdmin ? (
          <>
            <Shield className="mr-2 h-4 w-4" />
            관리자 해제
          </>
        ) : (
          <>
            <ShieldCheck className="mr-2 h-4 w-4" />
            관리자 지정
          </>
        )}
      </Button>
    </div>
  );
}

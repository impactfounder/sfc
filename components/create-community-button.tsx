"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function CreateCommunityButton() {
  const handleClick = () => {
    alert("준비 중인 기능입니다.")
  }

  return (
    <div className="mt-12 mb-8">
      <Card className="bg-slate-50 border-slate-200 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            새로운 커뮤니티를 만들어보세요
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            마음이 맞는 멤버들과 함께 성장하는 공간을 직접 개설할 수 있습니다.
          </p>
          <Button 
            onClick={handleClick}
            variant="outline" 
            className="h-12 px-8 border-slate-300 text-slate-700 hover:bg-white hover:text-slate-900 hover:border-slate-400 transition-all"
          >
            + 커뮤니티 개설신청
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}


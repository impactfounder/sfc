"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { PartnerProposalDialog } from "@/components/partner-proposal-dialog"

export function PartnerProposalButtonClient() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        className="bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-black rounded-full px-4 h-10 inline-flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        파트너스 신청
      </Button>

      <PartnerProposalDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  )
}


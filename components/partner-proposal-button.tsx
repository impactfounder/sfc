"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { PartnerProposalDialog } from "@/components/partner-proposal-dialog"

export function PartnerProposalButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        파트너스 신청하기
      </Button>

      <PartnerProposalDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  )
}


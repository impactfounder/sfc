"use client"

import { ReactNode } from "react"
import { PageHeader } from "@/components/page-header"

interface CommunityBannerProps {
  title: string
  description?: string
  actions?: ReactNode
}

export function CommunityBanner({
  title,
  description,
  actions
}: CommunityBannerProps) {
  return (
    <PageHeader
      title={title}
      description={description}
      className="w-full mb-0"
      compact={true}
    >
      {actions}
    </PageHeader>
  )
}

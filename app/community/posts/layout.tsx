import type { ReactNode } from "react"
import { ThreeColumnLayout } from "@/components/layout/three-column-layout"
import { StandardRightSidebar } from "@/components/standard-right-sidebar"

export default function CommunityPostsLayout({ children }: { children: ReactNode }) {
  return (
    <ThreeColumnLayout rightSidebar={<StandardRightSidebar />}>
      {children}
    </ThreeColumnLayout>
  )
}

import type { ReactNode } from "react"
import { StandardLayout } from "@/components/layout/standard-layout"

export default function CustomerCenterLayout({ children }: { children: ReactNode }) {
  return <StandardLayout>{children}</StandardLayout>
}

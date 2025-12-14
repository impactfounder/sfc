import type { ReactNode } from "react"
import { StandardLayout } from "@/components/layout/standard-layout"

export default function EventLayout({ children }: { children: ReactNode }) {
  return <StandardLayout>{children}</StandardLayout>
}

import { redirect } from "next/navigation"

export default function EventsPage() {
  // /events를 /e로 단순 리다이렉트하여 중복 레이아웃/쿼리 제거
  redirect("/e")
}

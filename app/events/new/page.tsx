import { redirect } from 'next/navigation'

export default async function NewEventPage() {
  // /events/new를 /e/new로 리다이렉트
  redirect('/e/new')
}


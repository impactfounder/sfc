import { redirect } from 'next/navigation';

export default async function ManageEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // /events/[id]/manage를 /e/[id]/manage로 리다이렉트
  redirect(`/e/${id}/manage`);
}

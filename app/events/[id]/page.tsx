// This file is incomplete and causing build errors.
// The working event detail page is at app/community/events/[id]/page.tsx
// TODO: Either complete this file or remove it

import { notFound } from 'next/navigation';

export default async function EventPage({ params }: { params: { id: string } }) {
  // Redirect to community events page
  notFound();
}

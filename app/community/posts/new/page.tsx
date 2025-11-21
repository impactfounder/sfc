import { createClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import { NewPostForm } from "@/components/new-post-form";

export default async function NewPostPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Create a New Post
          </h1>
          <p className="mt-2 text-slate-600">
            Share your thoughts with the community
          </p>
        </div>
        <NewPostForm userId={user.id} />
      </div>
    </div>
  );
}

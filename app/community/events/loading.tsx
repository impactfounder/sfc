import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function EventsLoading() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Skeleton className="h-10 w-32 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-12 w-48" />
        </div>

        <div className="mb-12">
          <Skeleton className="h-7 w-48 mb-4" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-full overflow-hidden border-slate-200">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-3">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

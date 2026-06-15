import { Skeleton } from '@/components/ui/skeleton';

export function PredictionSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Banner and Overall Circle */}
      <div className="flex flex-col items-center justify-center p-6 border border-gray-800/40 bg-gray-900/10 rounded-2xl">
        <Skeleton className="h-40 w-40 rounded-full mb-4" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Grid of score cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border border-gray-800/40 bg-gray-900/15 rounded-xl p-4.5 space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>

      {/* Tabs list */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-lg" />
        ))}
      </div>

      {/* Section body */}
      <div className="border border-gray-800/40 bg-gray-900/10 rounded-2xl p-6 space-y-4">
        <div className="flex gap-3 items-center">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
        
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

import { cn } from '@/lib/utils';

interface SkeletonShimmerProps {
  className?: string;
}

export function SkeletonShimmer({ className }: SkeletonShimmerProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "before:absolute before:inset-0",
        "before:translate-x-[-100%]",
        "before:animate-[shimmer_1.5s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-background/60 before:to-transparent",
        className
      )}
    />
  );
}

// Thread card skeleton
export function ThreadCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-3 sm:p-4 space-y-3">
      <div className="flex items-start gap-2 sm:gap-3">
        <SkeletonShimmer className="h-8 w-8 sm:h-10 sm:w-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2 min-w-0">
          <SkeletonShimmer className="h-4 sm:h-5 w-3/4 rounded" />
          <SkeletonShimmer className="h-3 w-1/2 rounded" />
        </div>
      </div>
      <div className="flex items-center gap-3 sm:gap-4">
        <SkeletonShimmer className="h-3 w-12 rounded" />
        <SkeletonShimmer className="h-3 w-16 rounded" />
        <SkeletonShimmer className="h-3 w-20 rounded" />
      </div>
    </div>
  );
}

// Category card skeleton
export function CategoryCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-3 sm:p-4">
      <div className="flex items-center gap-3 sm:gap-4">
        <SkeletonShimmer className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2 min-w-0">
          <SkeletonShimmer className="h-4 sm:h-5 w-1/3 rounded" />
          <SkeletonShimmer className="h-3 w-2/3 rounded" />
        </div>
        <SkeletonShimmer className="h-5 w-12 rounded-full shrink-0" />
      </div>
    </div>
  );
}

// Post card skeleton
export function PostCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
      <div className="flex items-start gap-2 sm:gap-3">
        <SkeletonShimmer className="h-8 w-8 sm:h-10 sm:w-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2 min-w-0">
          <SkeletonShimmer className="h-4 w-24 rounded" />
          <SkeletonShimmer className="h-3 w-16 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <SkeletonShimmer className="h-3 w-full rounded" />
        <SkeletonShimmer className="h-3 w-full rounded" />
        <SkeletonShimmer className="h-3 w-3/4 rounded" />
      </div>
      <div className="flex items-center gap-2 pt-2">
        <SkeletonShimmer className="h-7 w-16 rounded-md" />
        <SkeletonShimmer className="h-7 w-16 rounded-md" />
        <SkeletonShimmer className="h-7 w-16 rounded-md" />
      </div>
    </div>
  );
}

// Member card skeleton
export function MemberCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-3 sm:p-4">
      <div className="flex items-center gap-3">
        <SkeletonShimmer className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shrink-0" />
        <div className="flex-1 space-y-2 min-w-0">
          <SkeletonShimmer className="h-4 w-24 rounded" />
          <SkeletonShimmer className="h-3 w-16 rounded" />
        </div>
        <SkeletonShimmer className="h-6 w-16 rounded-full shrink-0" />
      </div>
    </div>
  );
}

// Sidebar card skeleton
export function SidebarCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <SkeletonShimmer className="h-5 w-1/3 rounded" />
      <div className="space-y-2">
        <SkeletonShimmer className="h-8 w-full rounded" />
        <SkeletonShimmer className="h-8 w-full rounded" />
        <SkeletonShimmer className="h-8 w-full rounded" />
      </div>
    </div>
  );
}

import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfiniteScrollLoaderProps {
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  className?: string;
}

export const InfiniteScrollLoader = forwardRef<HTMLDivElement, InfiniteScrollLoaderProps>(
  ({ isFetchingNextPage, hasNextPage, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center py-4 sm:py-6",
          className
        )}
      >
        {isFetchingNextPage ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
            <span className="text-xs sm:text-sm">Loading more...</span>
          </div>
        ) : hasNextPage ? (
          <span className="text-xs sm:text-sm text-muted-foreground">
            Scroll for more
          </span>
        ) : (
          <span className="text-xs sm:text-sm text-muted-foreground">
            No more items
          </span>
        )}
      </div>
    );
  }
);

InfiniteScrollLoader.displayName = 'InfiniteScrollLoader';

import { useState, useRef, useCallback, ReactNode } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
  threshold?: number;
}

export function PullToRefresh({ 
  onRefresh, 
  children, 
  className,
  threshold = 80 
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, currentY.current - startY.current);
    
    // Apply resistance
    const resistedDistance = Math.min(distance * 0.5, threshold * 1.5);
    setPullDistance(resistedDistance);
  }, [isPulling, isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold * 0.5);
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  const progress = Math.min(pullDistance / threshold, 1);
  const shouldTrigger = pullDistance >= threshold;

  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div 
        className={cn(
          "absolute left-0 right-0 flex items-center justify-center transition-all duration-200 z-10 pointer-events-none",
          (pullDistance > 0 || isRefreshing) ? "opacity-100" : "opacity-0"
        )}
        style={{ 
          height: pullDistance,
          top: 0,
        }}
      >
        <div 
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 transition-all duration-200",
            shouldTrigger && "bg-primary/20 scale-110"
          )}
          style={{
            transform: `rotate(${progress * 180}deg)`,
          }}
        >
          {isRefreshing ? (
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          ) : (
            <ArrowDown 
              className={cn(
                "h-5 w-5 transition-colors",
                shouldTrigger ? "text-primary" : "text-muted-foreground"
              )} 
            />
          )}
        </div>
      </div>
      
      {/* Content */}
      <div 
        className="transition-transform duration-200"
        style={{ 
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

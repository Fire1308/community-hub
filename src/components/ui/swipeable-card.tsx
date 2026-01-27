import { useState, useRef, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Bookmark, Share2, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/hooks/useHapticFeedback';

interface SwipeAction {
  icon: ReactNode;
  color: string;
  bgColor: string;
  onAction: () => void;
  label: string;
}

interface SwipeableCardProps {
  children: ReactNode;
  onBookmark?: () => void;
  onShare?: () => void;
  onHide?: () => void;
  disabled?: boolean;
  className?: string;
}

const SWIPE_THRESHOLD = 80;
const MAX_SWIPE = 120;

export function SwipeableCard({
  children,
  onBookmark,
  onShare,
  onHide,
  disabled = false,
  className,
}: SwipeableCardProps) {
  const [isRevealed, setIsRevealed] = useState<'left' | 'right' | null>(null);
  const constraintsRef = useRef(null);
  const x = useMotionValue(0);
  
  // Transform for left swipe actions (reveal right side)
  const rightActionsOpacity = useTransform(x, [-MAX_SWIPE, -SWIPE_THRESHOLD / 2, 0], [1, 0.5, 0]);
  const rightActionsScale = useTransform(x, [-MAX_SWIPE, -SWIPE_THRESHOLD / 2, 0], [1, 0.8, 0.5]);
  
  // Transform for right swipe actions (reveal left side)
  const leftActionsOpacity = useTransform(x, [0, SWIPE_THRESHOLD / 2, MAX_SWIPE], [0, 0.5, 1]);
  const leftActionsScale = useTransform(x, [0, SWIPE_THRESHOLD / 2, MAX_SWIPE], [0.5, 0.8, 1]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    
    if (Math.abs(offset) > SWIPE_THRESHOLD) {
      hapticFeedback('medium');
      
      if (offset < 0 && onBookmark) {
        // Swiped left - bookmark action
        setIsRevealed('left');
        setTimeout(() => {
          onBookmark();
          setIsRevealed(null);
        }, 200);
      } else if (offset > 0 && onShare) {
        // Swiped right - share action
        setIsRevealed('right');
        setTimeout(() => {
          onShare();
          setIsRevealed(null);
        }, 200);
      }
    }
  };

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={constraintsRef} className={cn('relative overflow-hidden rounded-lg', className)}>
      {/* Left action (Share) - revealed on right swipe */}
      <motion.div
        className="absolute inset-y-0 left-0 flex items-center justify-center w-20 bg-accent"
        style={{ opacity: leftActionsOpacity, scale: leftActionsScale }}
      >
        <div className="flex flex-col items-center gap-1 text-accent-foreground">
          <Share2 className="h-5 w-5" />
          <span className="text-[10px] font-medium">Share</span>
        </div>
      </motion.div>

      {/* Right action (Bookmark) - revealed on left swipe */}
      <motion.div
        className="absolute inset-y-0 right-0 flex items-center justify-center w-20 bg-primary"
        style={{ opacity: rightActionsOpacity, scale: rightActionsScale }}
      >
        <div className="flex flex-col items-center gap-1 text-primary-foreground">
          <Bookmark className="h-5 w-5" />
          <span className="text-[10px] font-medium">Bookmark</span>
        </div>
      </motion.div>

      {/* Main card content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -MAX_SWIPE, right: MAX_SWIPE }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative bg-background touch-pan-y"
        whileTap={{ cursor: 'grabbing' }}
      >
        {children}
      </motion.div>
    </div>
  );
}

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  onClick: () => void;
  className?: string;
  show?: boolean;
}

export function FloatingActionButton({ 
  onClick, 
  className,
  show = true 
}: FloatingActionButtonProps) {
  if (!show) return null;

  return (
    <Button
      onClick={onClick}
      size="icon"
      className={cn(
        "fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg md:hidden",
        "bg-primary hover:bg-primary/90 text-primary-foreground",
        "transition-all duration-300 ease-out",
        "hover:scale-105 active:scale-95",
        "animate-in fade-in slide-in-from-bottom-4",
        className
      )}
      aria-label="Create new thread"
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
}

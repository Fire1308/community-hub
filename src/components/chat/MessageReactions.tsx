import { useState } from 'react';
import { Smile, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useChatReactions, REACTION_TYPES } from '@/hooks/useChatFeatures';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface MessageReactionsProps {
  messageId: string;
  chatType: 'global' | 'private';
  isOwn?: boolean;
}

export function MessageReactions({ messageId, chatType, isOwn }: MessageReactionsProps) {
  const { user } = useAuth();
  const { groupedReactions, toggleReaction, userReactions, isLoading } = useChatReactions(messageId, chatType);
  const [showPicker, setShowPicker] = useState(false);

  const handleReaction = async (emoji: string) => {
    await toggleReaction(emoji);
    setShowPicker(false);
  };

  const hasReactions = Object.keys(groupedReactions).length > 0;

  return (
    <div className={cn(
      "flex items-center gap-1 mt-1 flex-wrap",
      isOwn ? "justify-end" : "justify-start"
    )}>
      {/* Existing reactions */}
      {Object.entries(groupedReactions).map(([emoji, userIds]) => {
        const hasReacted = userIds.includes(user?.id || '');
        return (
          <button
            key={emoji}
            onClick={() => handleReaction(emoji)}
            disabled={isLoading}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all",
              hasReacted 
                ? "bg-primary/20 text-primary border border-primary/30" 
                : "bg-muted hover:bg-muted/80 border border-transparent"
            )}
          >
            <span>{emoji}</span>
            <span className="font-medium">{userIds.length}</span>
          </button>
        );
      })}

      {/* Add reaction button */}
      <Popover open={showPicker} onOpenChange={setShowPicker}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity",
              hasReactions && "opacity-100"
            )}
          >
            {hasReactions ? (
              <Plus className="h-3 w-3" />
            ) : (
              <Smile className="h-3 w-3" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" side="top" align={isOwn ? "end" : "start"}>
          <div className="flex gap-1">
            {REACTION_TYPES.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                disabled={isLoading}
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded hover:bg-muted text-lg transition-transform hover:scale-125",
                  userReactions.includes(emoji) && "bg-primary/20"
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

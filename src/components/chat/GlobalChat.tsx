import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, AlertTriangle, Smile, ChevronUp, Loader2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalChat, useBanStatus } from '@/hooks/useGlobalChat';
import { useTypingIndicator, usePrefetchReactions, REACTION_TYPES } from '@/hooks/useChatFeatures';
import { formatDistanceToNow } from 'date-fns';
import { MessageReactions } from './MessageReactions';
import { useIsMobile } from '@/hooks/use-mobile';

const EMOJI_LIST = ['😀', '😂', '😍', '🥰', '😎', '🤔', '👍', '👎', '❤️', '🔥', '💯', '🎉', '🙏', '💪', '✨', '😢', '😮', '🤣', '😊', '🥺', '👀', '💀', '🤝', '👏'];

export function GlobalChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const isMobile = useIsMobile();
  
  const { user } = useAuth();
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    hasNextPage, 
    fetchNextPage, 
    isFetchingNextPage,
    shouldScrollToBottom,
    setShouldScrollToBottom,
  } = useGlobalChat();
  const { data: banStatus } = useBanStatus();
  const { typingUsers, setTyping, stopTyping } = useTypingIndicator('global');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Prefetch reactions for visible messages
  usePrefetchReactions(
    messages.map(m => m.id).filter(id => !id.startsWith('temp-')),
    'global'
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && shouldScrollToBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setShouldScrollToBottom(false);
    }
  }, [messages, isOpen, shouldScrollToBottom, setShouldScrollToBottom]);

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!chatRef.current) return;
    setIsDragging(true);
    const rect = chatRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!chatRef.current) return;
    setIsDragging(true);
    const touch = e.touches[0];
    const rect = chatRef.current.getBoundingClientRect();
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      const maxX = window.innerWidth - (chatRef.current?.offsetWidth || 350);
      const maxY = window.innerHeight - (chatRef.current?.offsetHeight || 500);
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const newX = touch.clientX - dragOffset.x;
      const newY = touch.clientY - dragOffset.y;
      const maxX = window.innerWidth - (chatRef.current?.offsetWidth || 350);
      const maxY = window.innerHeight - (chatRef.current?.offsetHeight || 500);
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleEnd = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragOffset]);

  // Handle typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (e.target.value) {
      setTyping();
    }
  };

  if (!user) return null;

  if (banStatus) {
    return (
      <div className="fixed z-50" style={{ left: position.x, bottom: isMobile ? 80 : position.y }}>
        <Card className="w-72 border-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Account Banned
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>You are currently banned from the forum.</p>
            {banStatus.reason && <p className="mt-1">Reason: {banStatus.reason}</p>}
            {banStatus.expires_at && (
              <p className="mt-1">Expires: {new Date(banStatus.expires_at).toLocaleDateString()}</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSend = () => {
    if (!message.trim() || sendMessage.isPending) return;
    sendMessage.mutate(message);
    setMessage('');
    setShowEmojis(false);
    stopTyping();
    setShouldScrollToBottom(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Calculate bottom position - above bottom nav on mobile
  const bottomPosition = isMobile ? 80 : 16;

  return (
    <div 
      ref={chatRef}
      className="fixed z-40"
      style={{ 
        left: isOpen ? position.x : 16, 
        bottom: isOpen ? 'auto' : bottomPosition,
        top: isOpen ? position.y : 'auto',
      }}
    >
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-12 w-12 shadow-lg hover:scale-105 transition-transform bg-gradient-to-br from-primary to-primary/80"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      ) : (
        <Card className="w-[calc(100vw-32px)] max-w-[320px] sm:w-[380px] shadow-2xl animate-in slide-in-from-bottom-4 border-primary/20">
          {/* Draggable Header */}
          <CardHeader 
            className="flex flex-row items-center justify-between p-3 border-b bg-gradient-to-r from-primary/10 to-transparent cursor-move select-none"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <CardTitle className="text-sm flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <MessageCircle className="h-4 w-4 text-primary" />
              Global Chat
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-[350px] sm:h-[400px]">
              <div className="p-2 sm:p-3">
                {/* Load More Button */}
                {hasNextPage && (
                  <div className="text-center mb-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={loadMore}
                      disabled={isFetchingNextPage}
                      className="gap-1 h-7 text-xs"
                    >
                      {isFetchingNextPage ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <ChevronUp className="h-3 w-3" />
                      )}
                      Load earlier
                    </Button>
                  </div>
                )}

                {isLoading ? (
                  <div className="flex items-center justify-center h-full py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground text-xs">
                    <MessageCircle className="h-10 w-10 mb-3 opacity-30" />
                    <p>No messages yet.</p>
                    <p className="text-[10px]">Be the first to say hello! 👋</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {messages.map((msg) => {
                      const isMe = msg.user_id === user.id;
                      return (
                        <div key={msg.id} className={`flex gap-1.5 ${isMe ? 'flex-row-reverse' : ''} group`}>
                          <Avatar className="h-6 w-6 flex-shrink-0 ring-1 ring-background">
                            <AvatarImage src={msg.profiles?.avatar_url || undefined} />
                            <AvatarFallback className="text-[10px] bg-primary/10">
                              {(msg.profiles?.display_name || msg.profiles?.username || '?')[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : ''}`}>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[10px] font-medium truncate max-w-[100px]">
                                {msg.profiles?.display_name || msg.profiles?.username}
                              </span>
                              <span className="text-[9px] text-muted-foreground">
                                {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <div
                              className={`rounded-xl px-2.5 py-1.5 text-xs ${
                                isMe
                                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                                  : 'bg-muted rounded-bl-sm'
                              }`}
                            >
                              {msg.message}
                            </div>
                            {/* Reactions */}
                            {!msg.id.startsWith('temp-') && (
                              <MessageReactions 
                                messageId={msg.id} 
                                chatType="global" 
                                isOwn={isMe}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}

                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground animate-pulse">
                    <div className="flex gap-0.5">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-[10px]">
                      {typingUsers.length === 1 
                        ? `${typingUsers[0].display_name || typingUsers[0].username} is typing...`
                        : `${typingUsers.length} people are typing...`
                      }
                    </span>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-2 sm:p-3 border-t bg-muted/30">
              <div className="flex items-center gap-1.5">
                <Popover open={showEmojis} onOpenChange={setShowEmojis}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                      <Smile className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" side="top" align="start">
                    <div className="grid grid-cols-8 gap-0.5">
                      {EMOJI_LIST.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => addEmoji(emoji)}
                          className="h-7 w-7 flex items-center justify-center hover:bg-muted rounded text-sm transition-transform hover:scale-110"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <Input
                  value={message}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full bg-background h-8 text-sm"
                />

                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!message.trim() || sendMessage.isPending}
                  className="h-8 w-8 rounded-full flex-shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

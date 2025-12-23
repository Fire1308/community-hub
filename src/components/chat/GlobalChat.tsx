import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, AlertTriangle, Smile, ChevronUp, Loader2 } from 'lucide-react';
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

const EMOJI_LIST = ['😀', '😂', '😍', '🥰', '😎', '🤔', '👍', '👎', '❤️', '🔥', '💯', '🎉', '🙏', '💪', '✨', '😢', '😮', '🤣', '😊', '🥺', '👀', '💀', '🤝', '👏'];

export function GlobalChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
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
      <div className="fixed bottom-4 left-4 z-50">
        <Card className="w-80 border-destructive">
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

  return (
    <div className="fixed bottom-3 sm:bottom-4 left-3 sm:left-4 z-50">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-12 w-12 sm:h-14 sm:w-14 shadow-lg hover:scale-105 transition-transform bg-gradient-to-br from-primary to-primary/80"
        >
          <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
      ) : (
        <Card className="w-[calc(100vw-24px)] max-w-[350px] sm:w-[400px] shadow-2xl animate-in slide-in-from-bottom-4 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-transparent">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              Global Chat
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="p-4">
                {/* Load More Button */}
                {hasNextPage && (
                  <div className="text-center mb-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={loadMore}
                      disabled={isFetchingNextPage}
                      className="gap-2"
                    >
                      {isFetchingNextPage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ChevronUp className="h-4 w-4" />
                      )}
                      Load earlier
                    </Button>
                  </div>
                )}

                {isLoading ? (
                  <div className="flex items-center justify-center h-full py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground text-sm">
                    <MessageCircle className="h-12 w-12 mb-4 opacity-30" />
                    <p>No messages yet.</p>
                    <p className="text-xs">Be the first to say hello! 👋</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isMe = msg.user_id === user.id;
                      return (
                        <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''} group`}>
                          <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-background">
                            <AvatarImage src={msg.profiles?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs bg-primary/10">
                              {(msg.profiles?.display_name || msg.profiles?.username || '?')[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : ''}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium">
                                {msg.profiles?.display_name || msg.profiles?.username}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <div
                              className={`rounded-2xl px-4 py-2 text-sm ${
                                isMe
                                  ? 'bg-primary text-primary-foreground rounded-br-md'
                                  : 'bg-muted rounded-bl-md'
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
                  <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground animate-pulse">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs">
                      {typingUsers.length === 1 
                        ? `${typingUsers[0].display_name || typingUsers[0].username} is typing...`
                        : `${typingUsers.length} people are typing...`
                      }
                    </span>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t bg-muted/30">
              <div className="flex items-center gap-2">
                <Popover open={showEmojis} onOpenChange={setShowEmojis}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
                      <Smile className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" side="top" align="start">
                    <div className="grid grid-cols-8 gap-1">
                      {EMOJI_LIST.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => addEmoji(emoji)}
                          className="h-8 w-8 flex items-center justify-center hover:bg-muted rounded text-lg transition-transform hover:scale-110"
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
                  className="flex-1 rounded-full bg-background"
                />

                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!message.trim() || sendMessage.isPending}
                  className="h-9 w-9 rounded-full flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

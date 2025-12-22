import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalChat, useBanStatus } from '@/hooks/useGlobalChat';
import { formatDistanceToNow } from 'date-fns';

export function GlobalChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const { user } = useAuth();
  const { messages, isLoading, sendMessage } = useGlobalChat();
  const { data: banStatus } = useBanStatus();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Don't show chat for non-authenticated users
  if (!user) return null;

  // Show ban notice
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
            {banStatus.reason && (
              <p className="mt-1">Reason: {banStatus.reason}</p>
            )}
            {banStatus.expires_at && (
              <p className="mt-1">
                Expires: {new Date(banStatus.expires_at).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage.mutate(message);
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg hover:scale-105 transition-transform"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      ) : (
        <Card className="w-80 sm:w-96 shadow-2xl animate-in slide-in-from-bottom-4">
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Global Chat
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-80 p-4" ref={scrollRef}>
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${
                        msg.user_id === user.id ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={msg.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {(msg.profiles?.display_name || msg.profiles?.username || '?')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`flex flex-col max-w-[70%] ${
                          msg.user_id === user.id ? 'items-end' : ''
                        }`}
                      >
                        <span className="text-xs text-muted-foreground mb-1">
                          {msg.profiles?.display_name || msg.profiles?.username}
                        </span>
                        <div
                          className={`rounded-lg px-3 py-2 text-sm ${
                            msg.user_id === user.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {msg.message}
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  disabled={sendMessage.isPending}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!message.trim() || sendMessage.isPending}
                >
                  {sendMessage.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

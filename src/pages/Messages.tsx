import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';
import { Send, Search, MoreVertical, Smile, Check, CheckCheck, ArrowLeft, User, MessageCircle, Eye, EyeOff, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOnlineStatus } from '@/hooks/useUnreadMessages';
import type { PrivateMessage, Profile } from '@/lib/supabase-types';

const EMOJI_LIST = ['😀', '😂', '😍', '🥰', '😎', '🤔', '👍', '👎', '❤️', '🔥', '💯', '🎉', '🙏', '💪', '✨', '😢', '😮', '🤣', '😊', '🥺', '👀', '💀', '🤝', '👏'];
const MESSAGES_PER_PAGE = 30;

type ConversationItem = { profile: Profile & { is_online?: boolean; show_online_status?: boolean }; lastMessage: PrivateMessage; unread: number };

export default function MessagesPage() {
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(searchParams.get('user'));
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesTopRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { showOnlineStatus, toggleOnlineVisibility, isLoading: statusLoading } = useOnlineStatus();
  
  // Track if we should scroll to bottom (only for new messages, not pagination)
  const shouldScrollToBottom = useRef(true);
  const pendingMessageId = useRef<string | null>(null);

  // Fetch all users for new chat
  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users', userSearchQuery],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from('profiles')
        .select('*, is_online, show_online_status')
        .neq('id', user.id)
        .limit(20);
      
      if (userSearchQuery) {
        query = query.or(`username.ilike.%${userSearchQuery}%,display_name.ilike.%${userSearchQuery}%`);
      }
      
      const { data } = await query;
      return (data || []) as (Profile & { is_online?: boolean; show_online_status?: boolean })[];
    },
    enabled: !!user && showNewChat,
  });

  // Fetch conversations
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: messages } = await supabase
        .from('private_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (!messages || messages.length === 0) return [];

      const userIds = new Set<string>();
      messages.forEach((msg: any) => {
        if (msg.sender_id !== user.id) userIds.add(msg.sender_id);
        if (msg.recipient_id !== user.id) userIds.add(msg.recipient_id);
      });

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*, is_online, show_online_status')
        .in('id', Array.from(userIds));

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const userMap = new Map<string, ConversationItem>();
      
      messages.forEach((msg: any) => {
        const otherUserId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
        const otherProfile = profileMap.get(otherUserId);
        
        if (otherProfile && !userMap.has(otherUserId)) {
          const unread = messages.filter((m: any) => 
            m.sender_id === otherUserId && !m.is_read
          ).length;
          userMap.set(otherUserId, {
            profile: otherProfile as Profile & { is_online?: boolean; show_online_status?: boolean },
            lastMessage: msg,
            unread,
          });
        }
      });

      return Array.from(userMap.values());
    },
    enabled: !!user,
    staleTime: 30000,
  });

  // Fetch messages with infinite query for pagination
  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: messagesLoading,
  } = useInfiniteQuery({
    queryKey: ['messages', user?.id, selectedUserId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user || !selectedUserId) return { messages: [], nextPage: null };

      const { data, error } = await supabase
        .from('private_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${selectedUserId}),and(sender_id.eq.${selectedUserId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + MESSAGES_PER_PAGE - 1);

      if (error) throw error;

      // Mark as read
      if (data && data.length > 0 && pageParam === 0) {
        supabase
          .from('private_messages')
          .update({ is_read: true })
          .eq('sender_id', selectedUserId)
          .eq('recipient_id', user.id)
          .eq('is_read', false)
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['conversations', user.id] });
            queryClient.invalidateQueries({ queryKey: ['unread-messages-count', user.id] });
          });
      }

      return {
        messages: (data || []).reverse() as PrivateMessage[],
        nextPage: data && data.length === MESSAGES_PER_PAGE ? pageParam + MESSAGES_PER_PAGE : null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!user && !!selectedUserId,
    staleTime: Infinity,
    initialPageParam: 0,
  });

  // Flatten messages from all pages
  const messages = messagesData?.pages.flatMap(page => page.messages) || [];

  // Send message with optimistic update - NO duplicate issue
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !selectedUserId) throw new Error('Not authenticated');

      const tempId = `temp-${Date.now()}-${Math.random()}`;
      pendingMessageId.current = tempId;

      const { data, error } = await supabase
        .from('private_messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedUserId,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return { ...data, tempId };
    },
    onMutate: async (content) => {
      shouldScrollToBottom.current = true;
      await queryClient.cancelQueries({ queryKey: ['messages', user?.id, selectedUserId] });
      
      const previousData = queryClient.getQueryData(['messages', user?.id, selectedUserId]);
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      pendingMessageId.current = tempId;

      const optimisticMessage: PrivateMessage = {
        id: tempId,
        sender_id: user!.id,
        recipient_id: selectedUserId!,
        content,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData(['messages', user?.id, selectedUserId], (old: any) => {
        if (!old) return { pages: [{ messages: [optimisticMessage], nextPage: null }], pageParams: [0] };
        
        const newPages = [...old.pages];
        const lastPageIndex = newPages.length - 1;
        newPages[lastPageIndex] = {
          ...newPages[lastPageIndex],
          messages: [...newPages[lastPageIndex].messages, optimisticMessage],
        };
        return { ...old, pages: newPages };
      });

      return { previousData, tempId };
    },
    onSuccess: (data, _, context) => {
      // Replace temp message with real one
      queryClient.setQueryData(['messages', user?.id, selectedUserId], (old: any) => {
        if (!old) return old;
        
        const newPages = old.pages.map((page: any) => ({
          ...page,
          messages: page.messages.map((msg: PrivateMessage) =>
            msg.id === context?.tempId ? data : msg
          ),
        }));
        return { ...old, pages: newPages };
      });
      
      queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
      pendingMessageId.current = null;
    },
    onError: (_, __, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['messages', user?.id, selectedUserId], context.previousData);
      }
      pendingMessageId.current = null;
    },
  });

  // Real-time subscription - FIXED to prevent duplicates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('private-messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
        },
        (payload) => {
          const newMsg = payload.new as PrivateMessage;
          
          // Only handle messages relevant to this user
          if (newMsg.recipient_id !== user.id && newMsg.sender_id !== user.id) return;

          // If this is from the current user, it was already added optimistically
          if (newMsg.sender_id === user.id) {
            // Just replace the temp message with the real one (already done in onSuccess)
            return;
          }

          // Incoming message from another user
          if (
            (newMsg.sender_id === selectedUserId && newMsg.recipient_id === user.id)
          ) {
            shouldScrollToBottom.current = true;
            
            queryClient.setQueryData(['messages', user.id, selectedUserId], (old: any) => {
              if (!old) return old;
              
              // Check if message already exists
              const allMessages = old.pages.flatMap((p: any) => p.messages);
              if (allMessages.some((m: PrivateMessage) => m.id === newMsg.id)) return old;
              
              const newPages = [...old.pages];
              const lastPageIndex = newPages.length - 1;
              newPages[lastPageIndex] = {
                ...newPages[lastPageIndex],
                messages: [...newPages[lastPageIndex].messages, newMsg],
              };
              return { ...old, pages: newPages };
            });

            // Mark as read immediately
            supabase
              .from('private_messages')
              .update({ is_read: true })
              .eq('id', newMsg.id)
              .then();
          }

          // Update conversations list
          queryClient.invalidateQueries({ queryKey: ['conversations', user.id] });
          queryClient.invalidateQueries({ queryKey: ['unread-messages-count', user.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'private_messages',
        },
        (payload) => {
          const updatedMsg = payload.new as PrivateMessage;
          
          queryClient.setQueryData(['messages', user.id, selectedUserId], (old: any) => {
            if (!old) return old;
            
            const newPages = old.pages.map((page: any) => ({
              ...page,
              messages: page.messages.map((m: PrivateMessage) =>
                m.id === updatedMsg.id ? { ...m, is_read: updatedMsg.is_read } : m
              ),
            }));
            return { ...old, pages: newPages };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedUserId, queryClient]);

  // Scroll to bottom only for new messages
  useEffect(() => {
    if (shouldScrollToBottom.current && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      shouldScrollToBottom.current = false;
    }
  }, [messages.length]);

  // Initial scroll to bottom when selecting conversation
  useEffect(() => {
    if (selectedUserId) {
      shouldScrollToBottom.current = true;
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
    }
  }, [selectedUserId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendMessage.isPending) return;
    sendMessage.mutate(newMessage.trim());
    setNewMessage('');
    setShowEmojis(false);
  };

  const startNewChat = (userId: string) => {
    setSelectedUserId(userId);
    setShowNewChat(false);
  };

  const loadMoreMessages = () => {
    if (hasNextPage && !isFetchingNextPage) {
      shouldScrollToBottom.current = false;
      fetchNextPage();
    }
  };

  const selectedConversation = conversations.find(c => c.profile.id === selectedUserId);
  const selectedProfile = selectedConversation?.profile || allUsers.find(u => u.id === selectedUserId);

  if (!user) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Sign in to Message</h2>
          <p className="text-muted-foreground mb-4">Connect with other members</p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-140px)] flex">
        {/* Sidebar */}
        <div className={`w-full md:w-80 lg:w-96 border-r flex flex-col bg-card ${selectedUserId ? 'hidden md:flex' : 'flex'}`}>
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold">Messages</h1>
              <div className="flex items-center gap-2">
                <Popover open={showSettings} onOpenChange={setShowSettings}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon">
                      {showOnlineStatus ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="end">
                    <div className="space-y-4">
                      <h4 className="font-medium">Activity Status</h4>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="online-status" className="text-sm">
                          Show when active
                        </Label>
                        <Switch
                          id="online-status"
                          checked={showOnlineStatus}
                          onCheckedChange={toggleOnlineVisibility}
                          disabled={statusLoading}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Others can see when you're online
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowNewChat(!showNewChat)}
                >
                  {showNewChat ? 'Cancel' : 'New Chat'}
                </Button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={showNewChat ? "Search users..." : "Search conversations..."}
                value={showNewChat ? userSearchQuery : searchQuery}
                onChange={(e) => showNewChat ? setUserSearchQuery(e.target.value) : setSearchQuery(e.target.value)}
                className="pl-9 rounded-full bg-muted/50"
              />
            </div>
          </div>

          {/* Conversations / Users List */}
          <ScrollArea className="flex-1">
            {showNewChat ? (
              <div className="divide-y">
                {allUsers.map((userItem) => (
                  <button
                    key={userItem.id}
                    onClick={() => startNewChat(userItem.id)}
                    className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={userItem.avatar_url || undefined} />
                        <AvatarFallback>{userItem.username?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {userItem.show_online_status && userItem.is_online && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-card" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{userItem.display_name || userItem.username}</p>
                      <p className="text-sm text-muted-foreground">@{userItem.username}</p>
                    </div>
                  </button>
                ))}
                {allUsers.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No users found</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="divide-y">
                {conversations
                  .filter(c =>
                    c.profile.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.profile.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(({ profile: p, lastMessage, unread }) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedUserId(p.id)}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left ${
                        selectedUserId === p.id ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={p.avatar_url || undefined} />
                          <AvatarFallback>{p.username?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {p.show_online_status && p.is_online && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-card" />
                        )}
                        {unread > 0 && (
                          <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
                            {unread}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{p.display_name || p.username}</p>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: false })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {lastMessage.sender_id === user.id && (
                            lastMessage.is_read ? (
                              <CheckCheck className="h-4 w-4 text-primary flex-shrink-0" />
                            ) : (
                              <Check className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )
                          )}
                          <p className={`text-sm truncate ${unread > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                            {lastMessage.content}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                {conversations.length === 0 && !showNewChat && (
                  <div className="p-8 text-center text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="mb-2">No conversations yet</p>
                    <Button variant="outline" size="sm" onClick={() => setShowNewChat(true)}>
                      Start a chat
                    </Button>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col bg-muted/30 ${!selectedUserId ? 'hidden md:flex' : 'flex'}`}>
          {selectedUserId && selectedProfile ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-card flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden"
                  onClick={() => setSelectedUserId(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedProfile.avatar_url || undefined} />
                    <AvatarFallback>{selectedProfile.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {selectedProfile.show_online_status && selectedProfile.is_online && (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-card" />
                  )}
                </div>
                <div className="flex-1">
                  <Link to={`/profile/${selectedProfile.username}`} className="font-medium hover:underline">
                    {selectedProfile.display_name || selectedProfile.username}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {selectedProfile.show_online_status && selectedProfile.is_online ? (
                      <span className="text-green-600">Active now</span>
                    ) : (
                      `@${selectedProfile.username}`
                    )}
                  </p>
                </div>
                <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-4 max-w-3xl mx-auto">
                  {/* Load More Button */}
                  {hasNextPage && (
                    <div className="text-center" ref={messagesTopRef}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadMoreMessages}
                        disabled={isFetchingNextPage}
                        className="gap-2"
                      >
                        {isFetchingNextPage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                        Load earlier messages
                      </Button>
                    </div>
                  )}

                  {messagesLoading && messages.length === 0 && (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    </div>
                  )}

                  {messages.map((message, idx) => {
                    const isMe = message.sender_id === user.id;
                    const showDate = idx === 0 || 
                      new Date(message.created_at).toDateString() !== new Date(messages[idx - 1].created_at).toDateString();
                    
                    return (
                      <div key={message.id}>
                        {showDate && (
                          <div className="text-center my-4">
                            <span className="text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground">
                              {format(new Date(message.created_at), 'MMMM d, yyyy')}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                              isMe
                                ? 'bg-primary text-primary-foreground rounded-br-md'
                                : 'bg-card rounded-bl-md shadow-sm'
                            }`}
                          >
                            <p className="break-words">{message.content}</p>
                            <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                              <span className="text-[10px]">
                                {format(new Date(message.created_at), 'HH:mm')}
                              </span>
                              {isMe && (
                                message.is_read ? (
                                  <CheckCheck className="h-3 w-3" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t bg-card">
                <form onSubmit={handleSend} className="flex items-center gap-2 max-w-3xl mx-auto">
                  <Popover open={showEmojis} onOpenChange={setShowEmojis}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="ghost" size="icon">
                        <Smile className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2" side="top">
                      <div className="grid grid-cols-8 gap-1">
                        {EMOJI_LIST.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setNewMessage(prev => prev + emoji);
                              setShowEmojis(false);
                            }}
                            className="h-8 w-8 flex items-center justify-center hover:bg-muted rounded text-lg"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-full"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    className="rounded-full"
                    disabled={!newMessage.trim() || sendMessage.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p className="text-sm">Choose from existing conversations or start a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

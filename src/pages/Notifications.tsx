import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { Bell, Check, CheckCheck, MessageSquare, Heart, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';

export default function NotificationsPage() {
  const { user } = useAuth();
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const getIcon = (type: string) => {
    switch (type) {
      case 'reply':
        return <MessageSquare className="h-5 w-5 text-primary" />;
      case 'mention':
        return <AtSign className="h-5 w-5 text-primary" />;
      case 'reaction':
        return <Heart className="h-5 w-5 text-primary" />;
      default:
        return <Bell className="h-5 w-5 text-primary" />;
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <p className="mb-4">Please sign in to view notifications</p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Layout>
      <div className="container py-6 md:py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
              <CheckCheck className="h-4 w-4 mr-2" /> Mark all as read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 h-16" />
              </Card>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map(notification => (
              <Card
                key={notification.id}
                className={`transition-colors ${!notification.is_read ? 'bg-primary/5 border-primary/20' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={notification.link || '#'}
                        onClick={() => {
                          if (!notification.is_read) {
                            markRead.mutate(notification.id);
                          }
                        }}
                        className="block"
                      >
                        <p className="font-medium">{notification.title}</p>
                        {notification.message && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </Link>
                    </div>
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markRead.mutate(notification.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications yet</p>
              <p className="text-sm mt-2">We'll notify you when something happens</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

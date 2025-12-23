import { Link, useLocation } from 'react-router-dom';
import { Home, FolderOpen, MessageSquare, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadMessagesCount } from '@/hooks/useUnreadMessages';
import { cn } from '@/lib/utils';

const navItems = [
  { title: 'Home', url: '/', icon: Home },
  { title: 'Categories', url: '/categories', icon: FolderOpen },
  { title: 'Messages', url: '/messages', icon: MessageSquare, requiresAuth: true, showBadge: true },
  { title: 'Profile', url: '/profile', icon: User, requiresAuth: true, dynamic: true },
];

export function MobileBottomNav() {
  const location = useLocation();
  const { user, profile } = useAuth();
  const { data: unreadMessages = 0 } = useUnreadMessagesCount();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/profile') return location.pathname.startsWith('/profile');
    return location.pathname.startsWith(path);
  };

  const getUrl = (item: typeof navItems[0]) => {
    if (item.dynamic && item.url === '/profile' && profile?.username) {
      return `/profile/${profile.username}`;
    }
    return item.url;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 safe-area-pb">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          // Skip auth-required items if not logged in
          if (item.requiresAuth && !user) {
            if (item.url === '/messages') {
              return (
                <Link
                  key="auth"
                  to="/auth"
                  className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-[10px] mt-1">Sign In</span>
                </Link>
              );
            }
            return null;
          }

          const active = isActive(item.url);
          const url = getUrl(item);

          return (
            <Link
              key={item.title}
              to={url}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-colors relative",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <item.icon className={cn("h-5 w-5", active && "stroke-[2.5px]")} />
                {item.showBadge && unreadMessages > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-4 min-w-4 flex items-center justify-center p-0 text-[10px]">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </Badge>
                )}
              </div>
              <span className={cn("text-[10px] mt-1", active && "font-medium")}>
                {item.title}
              </span>
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
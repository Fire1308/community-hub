import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { Link } from 'react-router-dom';

export function OnlineUsersCard() {
  const { onlineUsers, count } = useOnlineUsers();

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Online Now
          <span className="text-xs sm:text-sm font-normal text-muted-foreground">({count})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0">
        {count === 0 ? (
          <p className="text-xs sm:text-sm text-muted-foreground text-center py-2">
            No users online
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {onlineUsers.slice(0, 12).map((user) => (
              <Link
                key={user.id}
                to={`/profile/${user.username}`}
                className="group flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-lg hover:bg-muted active:scale-95 transition-all duration-200"
              >
                <div className="relative">
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8 ring-2 ring-green-500/20">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-[10px] sm:text-xs bg-primary/10 text-primary">
                      {(user.display_name || user.username)[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-green-500 border-2 border-background"></span>
                </div>
                <span className="text-xs sm:text-sm font-medium group-hover:text-primary transition-colors hidden sm:inline max-w-[80px] truncate">
                  {user.display_name || user.username}
                </span>
              </Link>
            ))}
            {count > 12 && (
              <div className="flex items-center justify-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-muted">
                <span className="text-[10px] sm:text-sm text-muted-foreground">+{count - 12}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

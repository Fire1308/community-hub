import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';
import { Link } from 'react-router-dom';

export function OnlineUsersCard() {
  const { onlineUsers, count } = useOnlineUsers();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Online Now
          <span className="text-sm font-normal text-muted-foreground">({count})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {count === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            No users online
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {onlineUsers.slice(0, 12).map((user) => (
              <Link
                key={user.id}
                to={`/profile/${user.username}`}
                className="group flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {(user.display_name || user.username)[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background"></span>
                </div>
                <span className="text-sm font-medium group-hover:text-primary transition-colors hidden sm:inline">
                  {user.display_name || user.username}
                </span>
              </Link>
            ))}
            {count > 12 && (
              <div className="flex items-center justify-center px-3 py-1.5 rounded-lg bg-muted">
                <span className="text-sm text-muted-foreground">+{count - 12} more</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

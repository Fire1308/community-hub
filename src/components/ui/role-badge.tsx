import { Shield, Star, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface RoleBadgeProps {
  role: AppRole | undefined;
  className?: string;
  showLabel?: boolean;
}

const roleConfig: Record<AppRole, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  admin: {
    label: 'Admin',
    icon: Shield,
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  moderator: {
    label: 'Mod',
    icon: Star,
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  member: {
    label: 'Member',
    icon: User,
    className: 'bg-muted text-muted-foreground border-border',
  },
  guest: {
    label: 'Guest',
    icon: User,
    className: 'bg-muted/50 text-muted-foreground/70 border-border/50',
  },
};

export function RoleBadge({ role, className, showLabel = true }: RoleBadgeProps) {
  if (!role || role === 'member' || role === 'guest') return null;
  
  const config = roleConfig[role];
  const Icon = config.icon;
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1 text-[10px] px-1.5 py-0 h-5 font-medium",
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {showLabel && config.label}
    </Badge>
  );
}

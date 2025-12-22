import { 
  Home, 
  FolderOpen, 
  Users, 
  Bookmark, 
  Settings, 
  Shield, 
  Search,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { user, profile, role } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const mainNav = [
    { title: 'Home', url: '/', icon: Home },
    { title: 'Categories', url: '/categories', icon: FolderOpen },
    { title: 'Members', url: '/members', icon: Users },
    { title: 'Search', url: '/search', icon: Search },
  ];

  const userNav = user ? [
    { title: 'Bookmarks', url: '/bookmarks', icon: Bookmark },
    { title: 'Profile', url: `/profile/${profile?.username}`, icon: User },
    { title: 'Settings', url: '/settings', icon: Settings },
  ] : [];

  const adminNav = (role === 'admin' || role === 'moderator') ? [
    { title: 'Admin Panel', url: '/admin', icon: Shield },
  ] : [];

  const NavItem = ({ item }: { item: { title: string; url: string; icon: React.ComponentType<{ className?: string }> } }) => {
    const Icon = item.icon;
    const active = isActive(item.url);
    
    const linkContent = (
      <Link
        to={item.url}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          active && "bg-sidebar-primary text-sidebar-primary-foreground",
          collapsed && "justify-center px-2"
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            {linkContent}
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  return (
    <Sidebar 
      collapsible="icon" 
      className={cn(
        "border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <SidebarHeader className="p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className={cn(
            "w-full justify-center h-9",
            !collapsed && "justify-end"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {/* Main Navigation */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
              Menu
            </p>
          )}
          {mainNav.map((item) => (
            <NavItem key={item.title} item={item} />
          ))}
        </div>

        {/* User Navigation */}
        {user && userNav.length > 0 && (
          <div className="space-y-1 mt-6">
            {!collapsed && (
              <p className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
                Account
              </p>
            )}
            {userNav.map((item) => (
              <NavItem key={item.title} item={item} />
            ))}
          </div>
        )}

        {/* Admin Navigation */}
        {adminNav.length > 0 && (
          <div className="space-y-1 mt-6">
            {!collapsed && (
              <p className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
                Admin
              </p>
            )}
            {adminNav.map((item) => (
              <NavItem key={item.title} item={item} />
            ))}
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed && (
          <p className="text-xs text-sidebar-foreground/40 text-center">
            © 2024 Forum
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

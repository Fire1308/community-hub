import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ForumThemeProvider } from "@/contexts/ForumThemeContext";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { RealtimeNotifications } from "@/components/notifications/RealtimeNotifications";
import { PageTransition } from "@/components/ui/page-transition";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Thread from "./pages/Thread";
import Category from "./pages/Category";
import Categories from "./pages/Categories";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import Notifications from "./pages/Notifications";
import Bookmarks from "./pages/Bookmarks";
import Messages from "./pages/Messages";
import Members from "./pages/Members";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <PageTransition>
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/thread/:threadId" element={<Thread />} />
        <Route path="/category/:slug" element={<Category />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/search" element={<Search />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/bookmarks" element={<Bookmarks />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/members" element={<Members />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </PageTransition>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <ForumThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <RealtimeNotifications />
            <BrowserRouter>
              <AnimatedRoutes />
              <ThemeSwitcher />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ForumThemeProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

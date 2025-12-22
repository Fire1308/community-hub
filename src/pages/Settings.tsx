import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Bell, Shield, Palette, Save, Trash2, Upload, Eye, EyeOff, ArrowLeft, ChevronRight, Lock, Mail, Clock, Sparkles } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useForumTheme, forumThemes, festivalThemes } from '@/contexts/ForumThemeContext';
import { useNotificationSettings, useUpdateNotificationSettings, useUpdateProfile, useUpdatePassword, useDeleteAccount } from '@/hooks/useSettings';
import { useFileUpload } from '@/hooks/useFileUpload';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Check } from 'lucide-react';

const settingsSections = [
  { id: 'profile', label: 'Profile', icon: User, description: 'Your public information' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Notification preferences' },
  { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Light/Dark mode' },
  { id: 'forum-style', label: 'Forum Style', icon: Sparkles, description: 'UI themes & festivals' },
  { id: 'security', label: 'Security', icon: Shield, description: 'Password & account' },
];

export default function Settings() {
  const { user, profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { forumTheme, setForumTheme, festivalTheme, setFestivalTheme } = useForumTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = searchParams.get('section') || 'profile';

  const { data: notificationSettings } = useNotificationSettings();
  const updateNotificationSettings = useUpdateNotificationSettings();
  const updateProfile = useUpdateProfile();
  const updatePassword = useUpdatePassword();
  const deleteAccount = useDeleteAccount();
  const { uploadFile, uploading } = useFileUpload();

  const [profileForm, setProfileForm] = useState({
    display_name: '',
    bio: '',
    location: '',
    avatar_url: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
    showPassword: false,
  });

  const [notifSettings, setNotifSettings] = useState({
    email_replies: true,
    email_mentions: true,
    email_reactions: false,
    push_replies: true,
    push_mentions: true,
    push_reactions: false,
  });

  // Password change with email verification
  const [passwordChangeDialog, setPasswordChangeDialog] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'request' | 'verify'>('request');
  const [otpCode, setOtpCode] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        avatar_url: profile.avatar_url || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (notificationSettings) {
      setNotifSettings({
        email_replies: notificationSettings.email_replies ?? true,
        email_mentions: notificationSettings.email_mentions ?? true,
        email_reactions: notificationSettings.email_reactions ?? false,
        push_replies: notificationSettings.push_replies ?? true,
        push_mentions: notificationSettings.push_mentions ?? true,
        push_reactions: notificationSettings.push_reactions ?? false,
      });
    }
  }, [notificationSettings]);

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await uploadFile(file);
    if (result) {
      setProfileForm(prev => ({ ...prev, avatar_url: result.url }));
      toast({ title: 'Avatar uploaded successfully' });
    } else {
      toast({ title: 'Failed to upload avatar', variant: 'destructive' });
    }
  };

  const handleProfileSave = async () => {
    try {
      await updateProfile.mutateAsync(profileForm);
      toast({ title: 'Profile updated successfully' });
    } catch {
      toast({ title: 'Failed to update profile', variant: 'destructive' });
    }
  };

  const handleNotificationSave = async () => {
    try {
      await updateNotificationSettings.mutateAsync(notifSettings);
      toast({ title: 'Notification settings updated' });
    } catch {
      toast({ title: 'Failed to update settings', variant: 'destructive' });
    }
  };

  const handleRequestPasswordChange = async () => {
    setVerificationLoading(true);
    try {
      // Send OTP to user's email via Supabase magic link
      const { error } = await supabase.auth.signInWithOtp({
        email: user.email!,
        options: {
          shouldCreateUser: false,
        }
      });
      
      if (error) throw error;
      
      toast({ 
        title: 'Verification code sent', 
        description: 'Check your email for the verification code' 
      });
      setVerificationStep('verify');
    } catch (error: unknown) {
      toast({ 
        title: 'Failed to send verification', 
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive' 
      });
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleVerifyAndChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    setVerificationLoading(true);
    try {
      // Verify OTP
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: user.email!,
        token: otpCode,
        type: 'email',
      });

      if (verifyError) throw verifyError;

      // Change password
      await updatePassword.mutateAsync(passwordForm.newPassword);
      toast({ title: 'Password updated successfully' });
      setPasswordChangeDialog(false);
      setPasswordForm({ newPassword: '', confirmPassword: '', showPassword: false });
      setOtpCode('');
      setVerificationStep('request');
    } catch (error: unknown) {
      toast({ 
        title: 'Verification failed', 
        description: error instanceof Error ? error.message : 'Invalid verification code',
        variant: 'destructive' 
      });
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount.mutateAsync();
      toast({ title: 'Account deleted' });
      navigate('/');
    } catch {
      toast({ title: 'Failed to delete account', variant: 'destructive' });
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Update your public information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profileForm.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl">
                    {profile?.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <Button variant="outline" asChild disabled={uploading}>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? 'Uploading...' : 'Change Avatar'}
                      </span>
                    </Button>
                  </Label>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    JPG, PNG or GIF. Max 5MB.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" value={profile?.username || ''} disabled />
                  <p className="text-sm text-muted-foreground">Username cannot be changed</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={profileForm.display_name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, display_name: e.target.value }))}
                    placeholder="Your display name"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself"
                    rows={4}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profileForm.location}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <Button onClick={handleProfileSave} disabled={updateProfile.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        );

      case 'notifications':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">Email Notifications</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Replies to your posts</Label>
                      <p className="text-sm text-muted-foreground">Get notified when someone replies</p>
                    </div>
                    <Switch
                      checked={notifSettings.email_replies}
                      onCheckedChange={(checked) => setNotifSettings(prev => ({ ...prev, email_replies: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Mentions</Label>
                      <p className="text-sm text-muted-foreground">When someone @mentions you</p>
                    </div>
                    <Switch
                      checked={notifSettings.email_mentions}
                      onCheckedChange={(checked) => setNotifSettings(prev => ({ ...prev, email_mentions: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Reactions</Label>
                      <p className="text-sm text-muted-foreground">When someone reacts to your post</p>
                    </div>
                    <Switch
                      checked={notifSettings.email_reactions}
                      onCheckedChange={(checked) => setNotifSettings(prev => ({ ...prev, email_reactions: checked }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">Push Notifications</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Replies</Label>
                      <p className="text-sm text-muted-foreground">Push notification for replies</p>
                    </div>
                    <Switch
                      checked={notifSettings.push_replies}
                      onCheckedChange={(checked) => setNotifSettings(prev => ({ ...prev, push_replies: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Mentions</Label>
                      <p className="text-sm text-muted-foreground">Push notification for mentions</p>
                    </div>
                    <Switch
                      checked={notifSettings.push_mentions}
                      onCheckedChange={(checked) => setNotifSettings(prev => ({ ...prev, push_mentions: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Reactions</Label>
                      <p className="text-sm text-muted-foreground">Push notification for reactions</p>
                    </div>
                    <Switch
                      checked={notifSettings.push_reactions}
                      onCheckedChange={(checked) => setNotifSettings(prev => ({ ...prev, push_reactions: checked }))}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleNotificationSave} disabled={updateNotificationSettings.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateNotificationSettings.isPending ? 'Saving...' : 'Save Preferences'}
              </Button>
            </CardContent>
          </Card>
        );

      case 'appearance':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Choose light or dark mode</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">Theme Mode</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    className="h-auto py-4 flex flex-col gap-2"
                    onClick={() => setTheme('light')}
                  >
                    <div className="w-full h-20 bg-background border rounded-md flex items-center justify-center">
                      <span className="text-4xl">☀️</span>
                    </div>
                    <span>Light Mode</span>
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    className="h-auto py-4 flex flex-col gap-2"
                    onClick={() => setTheme('dark')}
                  >
                    <div className="w-full h-20 bg-slate-900 border rounded-md flex items-center justify-center">
                      <span className="text-4xl">🌙</span>
                    </div>
                    <span>Dark Mode</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'forum-style':
        return (
          <div className="space-y-6">
            {/* Forum UI Themes */}
            <Card>
              <CardHeader>
                <CardTitle>Forum Style</CardTitle>
                <CardDescription>Choose how the forum looks and feels (15 unique styles)</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {forumThemes.map((themeOption) => {
                      const isActive = forumTheme === themeOption.id;
                      return (
                        <button
                          key={themeOption.id}
                          onClick={() => setForumTheme(themeOption.id)}
                          className={cn(
                            "relative flex flex-col items-start p-3 rounded-lg border-2 transition-all text-left",
                            isActive
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                          )}
                        >
                          {/* Preview */}
                          <div className={cn("w-full h-12 rounded-md mb-2", themeOption.preview)} />
                          <p className="font-medium text-sm">{themeOption.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{themeOption.description}</p>
                          {isActive && (
                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Separator />

            {/* Festival / Seasonal Themes */}
            <Card>
              <CardHeader>
                <CardTitle>Festival Theme</CardTitle>
                <CardDescription>Add seasonal decorations and animations (🇲🇲 Myanmar festivals included)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {festivalThemes.map((festival) => {
                    const isActive = festivalTheme === festival.id;
                    return (
                      <button
                        key={festival.id}
                        onClick={() => setFestivalTheme(festival.id)}
                        className={cn(
                          "relative flex flex-col items-center p-4 rounded-lg border-2 transition-all",
                          isActive
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        )}
                      >
                        <span className="text-3xl mb-2">{festival.emoji}</span>
                        <p className="font-medium text-sm">{festival.name}</p>
                        {festival.nameMM && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {festival.nameMM}
                          </Badge>
                        )}
                        <p className="text-xs text-muted-foreground text-center mt-1 line-clamp-1">{festival.description}</p>
                        {isActive && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>Update your account password with email verification</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setPasswordChangeDialog(true)}>
                  <Mail className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  You'll receive a verification code via email before changing your password
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Active Sessions
                </CardTitle>
                <CardDescription>Manage your login sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Current Session</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email} • Active now
                    </p>
                  </div>
                  <Button variant="outline" onClick={signOut}>
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions</CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove all your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account settings</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <nav className="space-y-1">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setSearchParams({ section: section.id })}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{section.label}</p>
                      <p className={cn(
                        "text-sm truncate",
                        isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}>
                        {section.description}
                      </p>
                    </div>
                    <ChevronRight className={cn(
                      "h-4 w-4",
                      isActive ? "text-primary-foreground" : "text-muted-foreground"
                    )} />
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            {renderContent()}
          </main>
        </div>
      </div>

      {/* Password Change Dialog with OTP */}
      <Dialog open={passwordChangeDialog} onOpenChange={setPasswordChangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {verificationStep === 'request' ? 'Verify Your Identity' : 'Enter Verification Code'}
            </DialogTitle>
            <DialogDescription>
              {verificationStep === 'request' 
                ? 'We will send a verification code to your email address'
                : `Enter the 6-digit code sent to ${user.email}`
              }
            </DialogDescription>
          </DialogHeader>

          {verificationStep === 'request' ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Verification code will be sent to: <strong>{user.email}</strong>
                </p>
              </div>
              <Button 
                onClick={handleRequestPasswordChange} 
                disabled={verificationLoading}
                className="w-full"
              >
                {verificationLoading ? 'Sending...' : 'Send Verification Code'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={passwordForm.showPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setPasswordForm(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                    >
                      {passwordForm.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type={passwordForm.showPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setVerificationStep('request');
                    setOtpCode('');
                  }}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleVerifyAndChangePassword}
                  disabled={verificationLoading || otpCode.length !== 6}
                >
                  {verificationLoading ? 'Verifying...' : 'Change Password'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

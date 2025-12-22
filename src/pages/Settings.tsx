import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Shield, Palette, Save, Trash2, Upload, Eye, EyeOff } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotificationSettings, useUpdateNotificationSettings, useUpdateProfile, useUpdatePassword, useDeleteAccount } from '@/hooks/useSettings';
import { useFileUpload } from '@/hooks/useFileUpload';

export default function Settings() {
  const { user, profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: notificationSettings } = useNotificationSettings();
  const updateNotificationSettings = useUpdateNotificationSettings();
  const updateProfile = useUpdateProfile();
  const updatePassword = useUpdatePassword();
  const deleteAccount = useDeleteAccount();
  const { uploadFile, uploading } = useFileUpload();

  const [profileForm, setProfileForm] = useState({
    display_name: profile?.display_name || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
    avatar_url: profile?.avatar_url || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
    showPassword: false,
  });

  const [notifSettings, setNotifSettings] = useState({
    email_replies: notificationSettings?.email_replies ?? true,
    email_mentions: notificationSettings?.email_mentions ?? true,
    email_reactions: notificationSettings?.email_reactions ?? false,
    push_replies: notificationSettings?.push_replies ?? true,
    push_mentions: notificationSettings?.push_mentions ?? true,
    push_reactions: notificationSettings?.push_reactions ?? false,
  });

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

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    try {
      await updatePassword.mutateAsync(passwordForm.newPassword);
      toast({ title: 'Password updated successfully' });
      setPasswordForm({ newPassword: '', confirmPassword: '', showPassword: false });
    } catch {
      toast({ title: 'Failed to update password', variant: 'destructive' });
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

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Update your profile information</CardDescription>
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
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
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
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how the forum looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4">Theme</h4>
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
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your account password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                  <Button onClick={handlePasswordChange} disabled={updatePassword.isPending}>
                    {updatePassword.isPending ? 'Updating...' : 'Update Password'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription>Irreversible account actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Delete Account</p>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all data
                      </p>
                    </div>
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
                          <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground">
                            Delete Account
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

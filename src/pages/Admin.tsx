import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users, Shield, Flag, BarChart3, FolderOpen, Settings,
  Search, MoreHorizontal, Ban, UserCheck, Trash2, Lock, Unlock,
  Plus, Edit, AlertTriangle, CheckCircle, XCircle, Eye
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  useAdminUsers,
  useUpdateUserRole,
  useBanUser,
  useUnbanUser,
  usePendingReports,
  useResolveReport,
  useForumStats,
  useAdminCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/useAdmin';
import { Database } from '@/integrations/supabase/types';
import { formatDistanceToNow } from 'date-fns';

type AppRole = Database['public']['Enums']['app_role'];

export default function Admin() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  const { toast } = useToast();

  const [userSearch, setUserSearch] = useState('');
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banType, setBanType] = useState<'temporary' | 'permanent'>('temporary');
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; description: string; slug: string } | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', slug: '', icon: '', color: '' });

  const { data: users, isLoading: usersLoading } = useAdminUsers(userSearch);
  const { data: reports } = usePendingReports();
  const { data: stats } = useForumStats();
  const { data: categories } = useAdminCategories();

  const updateRole = useUpdateUserRole();
  const banUser = useBanUser();
  const unbanUser = useUnbanUser();
  const resolveReport = useResolveReport();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  // Access control
  if (role !== 'admin' && role !== 'moderator') {
    navigate('/');
    return null;
  }

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    try {
      await updateRole.mutateAsync({ userId, role: newRole });
      toast({ title: 'Role updated successfully' });
    } catch {
      toast({ title: 'Failed to update role', variant: 'destructive' });
    }
  };

  const handleBanUser = async () => {
    if (!selectedUserId) return;
    try {
      await banUser.mutateAsync({
        userId: selectedUserId,
        banType,
        reason: banReason,
      });
      toast({ title: 'User banned successfully' });
      setBanDialogOpen(false);
      setBanReason('');
      setSelectedUserId(null);
    } catch {
      toast({ title: 'Failed to ban user', variant: 'destructive' });
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await unbanUser.mutateAsync(userId);
      toast({ title: 'User unbanned successfully' });
    } catch {
      toast({ title: 'Failed to unban user', variant: 'destructive' });
    }
  };

  const handleResolveReport = async (reportId: string, action: 'resolved' | 'dismissed') => {
    try {
      await resolveReport.mutateAsync({ reportId, action });
      toast({ title: `Report ${action}` });
    } catch {
      toast({ title: 'Failed to resolve report', variant: 'destructive' });
    }
  };

  const handleCreateCategory = async () => {
    try {
      await createCategory.mutateAsync(newCategory);
      toast({ title: 'Category created successfully' });
      setCategoryDialogOpen(false);
      setNewCategory({ name: '', description: '', slug: '', icon: '', color: '' });
    } catch {
      toast({ title: 'Failed to create category', variant: 'destructive' });
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    try {
      await updateCategory.mutateAsync(editingCategory);
      toast({ title: 'Category updated successfully' });
      setEditingCategory(null);
    } catch {
      toast({ title: 'Failed to update category', variant: 'destructive' });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory.mutateAsync(id);
      toast({ title: 'Category deleted' });
    } catch {
      toast({ title: 'Failed to delete category', variant: 'destructive' });
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center gap-4 mb-6">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage your community</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setSearchParams({ tab: v })}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
              {reports && reports.length > 0 && (
                <Badge variant="destructive" className="ml-1">{reports.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Categories</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">Registered members</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Threads</CardTitle>
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalThreads || 0}</div>
                  <p className="text-xs text-muted-foreground">Discussion threads</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalPosts || 0}</div>
                  <p className="text-xs text-muted-foreground">All time posts</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Posts Today</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.postsToday || 0}</div>
                  <p className="text-xs text-muted-foreground">Last 24 hours</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Reports</CardTitle>
                  <CardDescription>Reports requiring attention</CardDescription>
                </CardHeader>
                <CardContent>
                  {reports && reports.length > 0 ? (
                    <div className="space-y-4">
                      {reports.slice(0, 5).map((report) => (
                        <div key={report.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <div>
                              <p className="text-sm font-medium">{report.reason}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => setSearchParams({ tab: 'reports' })}>
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No pending reports</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common admin tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" onClick={() => setSearchParams({ tab: 'users' })}>
                    <Users className="h-4 w-4 mr-2" /> Manage Users
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => setSearchParams({ tab: 'categories' })}>
                    <FolderOpen className="h-4 w-4 mr-2" /> Manage Categories
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => setSearchParams({ tab: 'reports' })}>
                    <Flag className="h-4 w-4 mr-2" /> View Reports
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user roles and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                        </TableRow>
                      ) : users?.users.map((user) => {
                        const userRole = user.user_roles?.[0]?.role || 'member';
                        const activeBan = user.user_bans?.find((b: { is_active: boolean }) => b.is_active);
                        return (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={user.avatar_url || undefined} />
                                  <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{user.display_name || user.username}</p>
                                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={userRole}
                                onValueChange={(value) => handleRoleChange(user.id, value as AppRole)}
                                disabled={role !== 'admin'}
                              >
                                <SelectTrigger className="w-28">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="moderator">Moderator</SelectItem>
                                  <SelectItem value="member">Member</SelectItem>
                                  <SelectItem value="guest">Guest</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              {activeBan ? (
                                <Badge variant="destructive">Banned</Badge>
                              ) : (
                                <Badge variant="outline">Active</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem asChild>
                                    <Link to={`/profile/${user.username}`}>
                                      <Eye className="h-4 w-4 mr-2" /> View Profile
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {activeBan ? (
                                    <DropdownMenuItem onClick={() => handleUnbanUser(user.id)}>
                                      <UserCheck className="h-4 w-4 mr-2" /> Unban User
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedUserId(user.id);
                                        setBanDialogOpen(true);
                                      }}
                                      className="text-destructive"
                                    >
                                      <Ban className="h-4 w-4 mr-2" /> Ban User
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Ban Dialog */}
            <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ban User</DialogTitle>
                  <DialogDescription>This will restrict the user from accessing the forum.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Ban Type</Label>
                    <Select value={banType} onValueChange={(v) => setBanType(v as 'temporary' | 'permanent')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="temporary">Temporary</SelectItem>
                        <SelectItem value="permanent">Permanent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Reason</Label>
                    <Textarea
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      placeholder="Reason for the ban..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setBanDialogOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleBanUser}>Ban User</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Moderation Queue</CardTitle>
                <CardDescription>Review reported content</CardDescription>
              </CardHeader>
              <CardContent>
                {reports && reports.length > 0 ? (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <Card key={report.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="destructive">{report.reason}</Badge>
                                <span className="text-sm text-muted-foreground">
                                  {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              {report.description && (
                                <p className="text-sm">{report.description}</p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Reporter ID: {report.reporter_id?.slice(0, 8)}...
                              </p>
                              {report.reported_thread_id && (
                                <Link to={`/thread/${report.reported_thread_id}`} className="text-sm text-primary hover:underline">
                                  View Reported Thread
                                </Link>
                              )}
                              {report.reported_post_id && (
                                <p className="text-xs text-muted-foreground">Post ID: {report.reported_post_id.slice(0, 8)}...</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResolveReport(report.id, 'dismissed')}
                              >
                                <XCircle className="h-4 w-4 mr-1" /> Dismiss
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleResolveReport(report.id, 'resolved')}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" /> Resolve
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No pending reports</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Category Management</CardTitle>
                  <CardDescription>Manage forum categories</CardDescription>
                </div>
                <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" /> Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Category</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={newCategory.name}
                          onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Category name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Slug</Label>
                        <Input
                          value={newCategory.slug}
                          onChange={(e) => setNewCategory(prev => ({ ...prev, slug: e.target.value }))}
                          placeholder="category-slug"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={newCategory.description}
                          onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Category description"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreateCategory}>Create</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories?.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                          <TableCell>
                            {category.is_locked ? (
                              <Badge variant="secondary"><Lock className="h-3 w-3 mr-1" /> Locked</Badge>
                            ) : (
                              <Badge variant="outline"><Unlock className="h-3 w-3 mr-1" /> Open</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingCategory({
                                  id: category.id,
                                  name: category.name,
                                  description: category.description || '',
                                  slug: category.slug
                                })}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteCategory(category.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Edit Category Dialog */}
            <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Category</DialogTitle>
                </DialogHeader>
                {editingCategory && (
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={editingCategory.description}
                        onChange={(e) => setEditingCategory(prev => prev ? { ...prev, description: e.target.value } : null)}
                      />
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingCategory(null)}>Cancel</Button>
                  <Button onClick={handleUpdateCategory}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Forum Settings</CardTitle>
                <CardDescription>Configure forum-wide settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">Forum settings configuration coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

import { useState } from 'react';
import { Plus, TrendingUp, Clock, MessageSquare, HelpCircle, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { CategoryCard } from '@/components/forum/CategoryCard';
import { ThreadCard } from '@/components/forum/ThreadCard';
import { CreateThreadDialog } from '@/components/forum/CreateThreadDialog';
import { TrendingTopics } from '@/components/forum/TrendingTopics';
import { OnlineUsersCard } from '@/components/forum/OnlineUsersCard';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useCategories } from '@/hooks/useCategories';
import { useThreads } from '@/hooks/useThreads';
import { usePinnedThreads } from '@/hooks/usePinnedThreads';
import { usePopularTags } from '@/hooks/useTags';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

type ThreadFilter = 'latest' | 'trending' | 'unanswered';

const PAGE_SIZE = 10;

export default function HomePage() {
  const [filter, setFilter] = useState<ThreadFilter>('latest');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  
  const { user } = useAuth();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: pinnedThreads = [] } = usePinnedThreads();
  const { data: threadsData, isLoading: threadsLoading } = useThreads({ 
    filter, 
    limit: PAGE_SIZE, 
    offset: (page - 1) * PAGE_SIZE 
  });
  const { data: popularTags = [] } = usePopularTags(8);

  const threads = threadsData?.threads || [];
  // Filter out pinned threads from regular list to avoid duplicates
  const regularThreads = threads.filter(t => !t.is_pinned);
  const totalThreads = threadsData?.total || 0;
  const totalPages = Math.ceil(totalThreads / PAGE_SIZE);

  return (
    <Layout>
      <div className="container px-1.5 sm:px-4 py-4 sm:py-6 md:py-8 max-w-full overflow-hidden">
        {/* Hero Section */}
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-2">
            Welcome to the Community
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-4 sm:mb-6 max-w-2xl mx-auto px-2">
            Join discussions, share knowledge, and connect with others. Your voice matters here.
          </p>
          {user ? (
            <Button size="default" className="sm:text-base" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" /> Start a Discussion
            </Button>
          ) : (
            <Button size="default" className="sm:text-base" asChild>
              <Link to="/auth">Join the Community</Link>
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 min-w-0">
            {/* Pinned Threads Section - Separate from Recent Discussions */}
            {pinnedThreads.length > 0 && (
              <Card>
                <CardHeader className="pb-3 px-3 sm:px-6">
                  <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                    <span>Pinned</span>
                    <Pin className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 px-3 sm:px-6">
                  {pinnedThreads.map(thread => (
                    <ThreadCard key={thread.id} thread={thread} />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Thread Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <h2 className="text-lg sm:text-xl font-semibold">Recent Discussions</h2>
              <Tabs value={filter} onValueChange={(v) => { setFilter(v as ThreadFilter); setPage(1); }}>
                <TabsList className="h-9">
                  <TabsTrigger value="latest" className="gap-1 text-xs sm:text-sm px-2 sm:px-3">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline sm:inline">Latest</span>
                  </TabsTrigger>
                  <TabsTrigger value="trending" className="gap-1 text-xs sm:text-sm px-2 sm:px-3">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline sm:inline">Trending</span>
                  </TabsTrigger>
                  <TabsTrigger value="unanswered" className="gap-1 text-xs sm:text-sm px-2 sm:px-3">
                    <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline sm:inline">Unanswered</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Regular Threads List */}
            <div className="space-y-2 sm:space-y-3">
              {threadsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-3 sm:p-4 h-20 sm:h-24" />
                  </Card>
                ))
              ) : regularThreads.length > 0 ? (
                regularThreads.map(thread => (
                  <ThreadCard key={thread.id} thread={thread} />
                ))
              ) : pinnedThreads.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No threads found. Be the first to start a discussion!</p>
                  </CardContent>
                </Card>
              ) : null}

              {/* Pagination */}
              {totalPages > 1 && (
                <PaginationControls
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  className="mt-6"
                />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Online Users */}
            <OnlineUsersCard />

            {/* Trending Topics */}
            <TrendingTopics />

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Categories
                  <Link to="/categories">
                    <Button variant="ghost" size="sm">View All</Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {categoriesLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                  ))
                ) : (
                  categories.slice(0, 4).map(category => (
                    <CategoryCard key={category.id} category={category} showThreadCount={false} />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Popular Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Popular Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map(tag => (
                    <Link key={tag.id} to={`/search?tag=${tag.slug}`}>
                      <Badge variant="secondary" className="cursor-pointer hover:bg-primary/10">
                        #{tag.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Community Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{totalThreads}+</div>
                    <div className="text-sm text-muted-foreground">Discussions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{categories.length}</div>
                    <div className="text-sm text-muted-foreground">Categories</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <CreateThreadDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </Layout>
  );
}

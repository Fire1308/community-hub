import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Layout } from '@/components/layout/Layout';
import { ThreadCard } from '@/components/forum/ThreadCard';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useSearch } from '@/hooks/useSearch';

const PAGE_SIZE = 10;

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const tagSlug = searchParams.get('tag') || '';
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [searchType, setSearchType] = useState<'all' | 'threads' | 'posts' | 'users'>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1); // Reset page on new search
      if (query) {
        setSearchParams({ q: query });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, setSearchParams]);

  const { data: results, isLoading } = useSearch(debouncedQuery || tagSlug, { 
    type: tagSlug ? 'threads' : searchType,
    tagSlug: tagSlug || undefined
  });

  // Paginate results client-side
  const paginatedThreads = results?.threads?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) || [];
  const paginatedPosts = results?.posts?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) || [];
  const paginatedUsers = results?.users?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) || [];
  
  const totalItems = (results?.threads?.length || 0) + (results?.posts?.length || 0) + (results?.users?.length || 0);
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  return (
    <Layout>
      <div className="container px-2 sm:px-4 py-4 sm:py-8 max-w-full">
        <h1 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-6">
          {tagSlug ? `Tag: #${tagSlug}` : 'Search'}
        </h1>

        {/* Search Input */}
        <div className="relative mb-4 sm:mb-6">
          <SearchIcon className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search threads, posts, users..."
            className="pl-9 sm:pl-12 h-10 sm:h-12 text-sm sm:text-lg"
            autoFocus
          />
        </div>

        {/* Filters */}
        <Tabs value={searchType} onValueChange={(v) => { setSearchType(v as typeof searchType); setPage(1); }} className="mb-4 sm:mb-6">
          <TabsList className="h-8 sm:h-9">
            <TabsTrigger value="all" className="text-xs sm:text-sm px-2 sm:px-3">All</TabsTrigger>
            <TabsTrigger value="threads" className="text-xs sm:text-sm px-2 sm:px-3">Threads</TabsTrigger>
            <TabsTrigger value="posts" className="text-xs sm:text-sm px-2 sm:px-3">Posts</TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm px-2 sm:px-3">Users</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Results */}
        {isLoading ? (
          <div className="space-y-2 sm:space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-3 sm:p-4 h-16 sm:h-20" />
              </Card>
            ))}
          </div>
        ) : !debouncedQuery && !tagSlug ? (
          <Card>
            <CardContent className="p-8 sm:p-12 text-center text-muted-foreground">
              <SearchIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-sm sm:text-base">Enter a search term to find threads, posts, and users</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Threads */}
            {(searchType === 'all' || searchType === 'threads') && results?.threads && results.threads.length > 0 && (
              <div>
                <h2 className="text-base sm:text-xl font-semibold mb-2 sm:mb-4">Threads ({results.threads.length})</h2>
                <div className="space-y-2 sm:space-y-4">
                  {paginatedThreads.map(thread => (
                    <ThreadCard key={thread.id} thread={thread} />
                  ))}
                </div>
              </div>
            )}

            {/* Posts */}
            {(searchType === 'all' || searchType === 'posts') && results?.posts && results.posts.length > 0 && (
              <div>
                <h2 className="text-base sm:text-xl font-semibold mb-2 sm:mb-4">Posts ({results.posts.length})</h2>
                <div className="space-y-2 sm:space-y-4">
                  {paginatedPosts.map(post => (
                    <Card key={post.id} className="hover:shadow-md active:scale-[0.99] transition-all duration-200">
                      <CardContent className="p-3 sm:p-4">
                        <Link to={`/thread/${post.thread_id}`} className="block">
                          <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                            <Avatar className="h-5 w-5 sm:h-6 sm:w-6 ring-1 ring-primary/10">
                              <AvatarImage src={post.author?.avatar_url || undefined} />
                              <AvatarFallback className="text-[8px] sm:text-[10px]">{post.author?.username?.[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs sm:text-sm font-medium">{post.author?.username}</span>
                          </div>
                          <p className="text-xs sm:text-sm line-clamp-2">{post.content}</p>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Users */}
            {(searchType === 'all' || searchType === 'users') && results?.users && results.users.length > 0 && (
              <div>
                <h2 className="text-base sm:text-xl font-semibold mb-2 sm:mb-4">Users ({results.users.length})</h2>
                <div className="grid gap-2 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {paginatedUsers.map(user => (
                    <Link key={user.id} to={`/profile/${user.username}`}>
                      <Card className="hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-200">
                        <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-primary/10">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="text-sm bg-primary/10 text-primary">{user.username?.[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium text-sm sm:text-base truncate">{user.display_name || user.username}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground">@{user.username}</div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                className="mt-4 sm:mt-6"
              />
            )}

            {/* No Results */}
            {results && 
              (!results.threads?.length && !results.posts?.length && !results.users?.length) && (
              <Card>
                <CardContent className="p-8 sm:p-12 text-center text-muted-foreground">
                  <p className="text-sm sm:text-base">No results found for "{debouncedQuery}"</p>
                  <p className="text-xs sm:text-sm mt-1 sm:mt-2">Try different keywords or check spelling</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Layout } from '@/components/layout/Layout';
import { ThreadCard } from '@/components/forum/ThreadCard';
import { useSearch } from '@/hooks/useSearch';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [searchType, setSearchType] = useState<'all' | 'threads' | 'posts' | 'users'>('all');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      if (query) {
        setSearchParams({ q: query });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, setSearchParams]);

  const { data: results, isLoading } = useSearch(debouncedQuery, { type: searchType });

  return (
    <Layout>
      <div className="container py-6 md:py-8">
        <h1 className="text-3xl font-bold mb-6">Search</h1>

        {/* Search Input */}
        <div className="relative mb-6">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search threads, posts, users..."
            className="pl-12 h-12 text-lg"
            autoFocus
          />
        </div>

        {/* Filters */}
        <Tabs value={searchType} onValueChange={(v) => setSearchType(v as typeof searchType)} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="threads">Threads</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Results */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 h-20" />
              </Card>
            ))}
          </div>
        ) : !debouncedQuery ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Enter a search term to find threads, posts, and users</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Threads */}
            {(searchType === 'all' || searchType === 'threads') && results?.threads && results.threads.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Threads ({results.threads.length})</h2>
                <div className="space-y-4">
                  {results.threads.map(thread => (
                    <ThreadCard key={thread.id} thread={thread} />
                  ))}
                </div>
              </div>
            )}

            {/* Posts */}
            {(searchType === 'all' || searchType === 'posts') && results?.posts && results.posts.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Posts ({results.posts.length})</h2>
                <div className="space-y-4">
                  {results.posts.map(post => (
                    <Card key={post.id}>
                      <CardContent className="p-4">
                        <Link to={`/thread/${post.thread_id}`} className="block">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={post.author?.avatar_url || undefined} />
                              <AvatarFallback>{post.author?.username?.[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{post.author?.username}</span>
                          </div>
                          <p className="text-sm line-clamp-2">{post.content}</p>
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
                <h2 className="text-xl font-semibold mb-4">Users ({results.users.length})</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {results.users.map(user => (
                    <Link key={user.id} to={`/profile/${user.username}`}>
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>{user.username?.[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.display_name || user.username}</div>
                            <div className="text-sm text-muted-foreground">@{user.username}</div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {results && 
              (!results.threads?.length && !results.posts?.length && !results.users?.length) && (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  <p>No results found for "{debouncedQuery}"</p>
                  <p className="text-sm mt-2">Try different keywords or check spelling</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

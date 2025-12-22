import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Layout } from '@/components/layout/Layout';
import { ThreadCard } from '@/components/forum/ThreadCard';
import { CreateThreadDialog } from '@/components/forum/CreateThreadDialog';
import { BackButton } from '@/components/layout/BackButton';
import { useCategory } from '@/hooks/useCategories';
import { useThreads } from '@/hooks/useThreads';
import { useAuth } from '@/contexts/AuthContext';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: category, isLoading: categoryLoading } = useCategory(slug!);
  const { data: threads = [], isLoading: threadsLoading } = useThreads({
    categoryId: category?.id,
  });

  if (categoryLoading) {
    return (
      <Layout>
        <div className="container py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!category) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Category not found</h1>
          <Button asChild>
            <Link to="/categories">View All Categories</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6">
        {/* Back Button & Breadcrumb */}
        <div className="flex items-center gap-4 mb-6">
          <BackButton fallbackPath="/categories" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link to="/categories" className="hover:text-foreground">Categories</Link>
            <span>/</span>
            <span className="text-foreground">{category.name}</span>
          </div>
        </div>

        {/* Category Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div
                className="h-16 w-16 rounded-lg flex items-center justify-center text-3xl shrink-0"
                style={{ backgroundColor: category.color || '#3b82f6' + '20' }}
              >
                {category.icon || '💬'}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">{category.name}</h1>
                {category.description && (
                  <p className="text-muted-foreground mb-4">{category.description}</p>
                )}
                {category.rules && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Category Rules</h3>
                    <p className="text-sm text-muted-foreground">{category.rules}</p>
                  </div>
                )}
              </div>
              {user && !category.is_locked && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> New Thread
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Threads */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Threads {threads.length > 0 && `(${threads.length})`}
          </h2>

          {threadsLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 h-24" />
              </Card>
            ))
          ) : threads.length > 0 ? (
            threads.map(thread => (
              <ThreadCard key={thread.id} thread={thread} />
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <p className="mb-4">No threads in this category yet.</p>
                {user && !category.is_locked && (
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Start the First Thread
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <CreateThreadDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        defaultCategoryId={category.id}
      />
    </Layout>
  );
}

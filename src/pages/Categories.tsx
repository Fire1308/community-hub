import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { CategoryCard } from '@/components/forum/CategoryCard';
import { useCategories } from '@/hooks/useCategories';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { CategoryCardSkeleton } from '@/components/ui/skeleton-shimmer';
import { useQueryClient } from '@tanstack/react-query';

const STORAGE_KEY = 'forum-categories-collapsed';

export default function CategoriesPage() {
  const { data: categories = [], isLoading, refetch } = useCategories();
  const queryClient = useQueryClient();

  // Collapsed state: { [parentId]: boolean } where true = collapsed
  const [collapsedState, setCollapsedState] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsedState));
    } catch {}
  }, [collapsedState]);

  const toggleCollapsed = (parentId: string) => {
    setCollapsedState(prev => ({ ...prev, [parentId]: !prev[parentId] }));
  };

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['categories'] });
    await refetch();
  }, [queryClient, refetch]);

  // Separate parent categories and subcategories
  const parentCategories = categories.filter(c => !c.parent_id);
  const getSubcategories = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  return (
    <Layout>
      <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
        <div className="container px-1.5 sm:px-4 py-4 sm:py-6 md:py-8 max-w-full overflow-hidden">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-center">Categories</h1>

          {isLoading ? (
            <div className="space-y-3 sm:space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <CategoryCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {parentCategories.map(category => {
                const subcategories = getSubcategories(category.id);
                const hasSubcategories = subcategories.length > 0;
                const isOpen = !collapsedState[category.id];

                return (
                  <div key={category.id} className="w-full">
                    {/* Category Card with optional expand/collapse */}
                    <div 
                      className={hasSubcategories ? 'cursor-pointer' : ''}
                      onClick={hasSubcategories ? () => toggleCollapsed(category.id) : undefined}
                    >
                      <CategoryCard 
                        category={category} 
                        showExpandIcon={hasSubcategories}
                        isExpanded={isOpen}
                      />
                    </div>

                    {/* Subcategories */}
                    {hasSubcategories && (
                      <Collapsible open={isOpen}>
                        <CollapsibleContent>
                          <div className="ml-4 sm:ml-6 mt-2 sm:mt-3 pl-3 sm:pl-4 border-l-2 border-border space-y-2 sm:space-y-3">
                            {subcategories.map(sub => (
                              <CategoryCard key={sub.id} category={sub} />
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PullToRefresh>
    </Layout>
  );
}

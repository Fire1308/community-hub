import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { CategoryCard } from '@/components/forum/CategoryCard';
import { useCategories } from '@/hooks/useCategories';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const STORAGE_KEY = 'forum-categories-collapsed';

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useCategories();

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

  // Separate parent categories and subcategories
  const parentCategories = categories.filter(c => !c.parent_id);
  const getSubcategories = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  return (
    <Layout>
      <div className="container py-6 md:py-8">
        <h1 className="text-3xl font-bold mb-6">Categories</h1>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 h-24" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {parentCategories.map(category => {
              const subcategories = getSubcategories(category.id);
              const hasSubcategories = subcategories.length > 0;
              const isOpen = !collapsedState[category.id];

              return (
                <div key={category.id}>
                  <div className="flex items-start gap-2">
                    {hasSubcategories && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 mt-2"
                        onClick={() => toggleCollapsed(category.id)}
                        aria-label={isOpen ? 'Collapse' : 'Expand'}
                      >
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <div className={hasSubcategories ? 'flex-1' : 'flex-1 ml-10'}>
                      <CategoryCard category={category} />
                    </div>
                  </div>

                  {/* Subcategories */}
                  {hasSubcategories && (
                    <Collapsible open={isOpen}>
                      <CollapsibleContent>
                        <div className="ml-14 mt-3 pl-4 border-l-2 border-border space-y-3">
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
    </Layout>
  );
}

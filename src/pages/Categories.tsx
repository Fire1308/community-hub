import { Layout } from '@/components/layout/Layout';
import { CategoryCard } from '@/components/forum/CategoryCard';
import { useCategories } from '@/hooks/useCategories';
import { Card, CardContent } from '@/components/ui/card';

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useCategories();

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
          <div className="space-y-8">
            {parentCategories.map(category => (
              <div key={category.id}>
                <CategoryCard category={category} />
                
                {/* Subcategories */}
                {getSubcategories(category.id).length > 0 && (
                  <div className="ml-6 mt-3 pl-4 border-l-2 border-border space-y-3">
                    {getSubcategories(category.id).map(sub => (
                      <CategoryCard key={sub.id} category={sub} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

import { Link } from 'react-router-dom';
import { MessageSquare, Lock, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Category } from '@/lib/supabase-types';
import { useCategoryThreadCount } from '@/hooks/useCategories';
import { hapticFeedback } from '@/hooks/useHapticFeedback';

interface CategoryCardProps {
  category: Category;
  showThreadCount?: boolean;
  showExpandIcon?: boolean;
  isExpanded?: boolean;
}

export function CategoryCard({ 
  category, 
  showThreadCount = true,
  showExpandIcon = false,
  isExpanded = false,
}: CategoryCardProps) {
  const { data: threadCount = 0 } = useCategoryThreadCount(category.id);

  const cardContent = (
    <Card className="hover:shadow-lg hover:scale-[1.005] active:scale-[0.995] transition-all duration-200 cursor-pointer group">
      <CardContent className="p-3 sm:p-4 flex items-start gap-3 sm:gap-4">
        <div
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center text-xl sm:text-2xl shrink-0 transition-transform duration-200 group-hover:scale-110"
          style={{ backgroundColor: category.color || '#3b82f6' + '20' }}
        >
          {category.icon || '💬'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
            <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors truncate">
              {category.name}
            </h3>
            {category.is_locked && (
              <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
            )}
          </div>
          {category.description && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
              {category.description}
            </p>
          )}
          {showThreadCount && (
            <div className="flex items-center gap-4 mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {threadCount} threads
              </span>
            </div>
          )}
        </div>
        {showExpandIcon && (
          <div className="shrink-0 self-center text-muted-foreground">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // If showing expand icon, don't wrap in Link (parent handles click)
  if (showExpandIcon) {
    return (
      <div onClick={() => hapticFeedback('selection')}>
        {cardContent}
      </div>
    );
  }

  return (
    <Link to={`/category/${category.slug}`} onClick={() => hapticFeedback('selection')}>
      {cardContent}
    </Link>
  );
}

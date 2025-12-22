import { useState, useMemo } from 'react';

export interface PaginationState {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export function usePagination(totalItems: number, pageSize: number = 10) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const pagination: PaginationState = useMemo(() => ({
    page,
    pageSize,
    totalItems,
    totalPages,
  }), [page, pageSize, totalItems, totalPages]);

  const goToPage = (newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  const nextPage = () => goToPage(page + 1);
  const prevPage = () => goToPage(page - 1);
  const resetPage = () => setPage(1);

  const offset = (page - 1) * pageSize;

  return {
    ...pagination,
    offset,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

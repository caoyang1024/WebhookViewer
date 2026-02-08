import { useCallback, useState } from 'react';
import type { MessageFilter } from '../types/webhook';

const defaultFilter: MessageFilter = {
  levels: 'Warning,Error,Fatal',
  page: 1,
  pageSize: 50,
};

export function useMessageFilter() {
  const [filter, setFilter] = useState<MessageFilter>(defaultFilter);

  const setLevels = useCallback((levels: string | undefined) => {
    setFilter(f => ({ ...f, levels, page: 1 }));
  }, []);

  const setPathContains = useCallback((pathContains: string | undefined) => {
    setFilter(f => ({ ...f, pathContains, page: 1 }));
  }, []);

  const setSearchPattern = useCallback((searchPattern: string | undefined) => {
    setFilter(f => ({ ...f, searchPattern, page: 1 }));
  }, []);

  const setDateRange = useCallback((from?: string, to?: string) => {
    setFilter(f => ({ ...f, from, to, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setFilter(f => ({ ...f, page }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilter(defaultFilter);
  }, []);

  return { filter, setLevels, setPathContains, setSearchPattern, setDateRange, setPage, resetFilters };
}

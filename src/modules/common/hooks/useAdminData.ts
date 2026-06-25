'use client';

import { useState, useEffect, useCallback, useRef, Dispatch, SetStateAction } from 'react';
import { notifyAboutError } from '@/modules/application/utils/notifyAboutError';

interface UseAdminDataOptions<T> {
  fetchFn: () => Promise<T[]>;
  /** Optional predicate for text search. When provided, filteredData reflects searchTerm. */
  filterFn?: (item: T, term: string) => boolean;
  /** Seed data (e.g. from server props). Skips loading state and initial fetch. */
  initialData?: T[];
  /** Whether to fetch immediately on mount. Default true. Pass false when an external
   *  dependency (e.g. selectedSchoolId) controls when the first fetch should fire. */
  fetchOnMount?: boolean;
}

interface UseAdminDataResult<T> {
  /** Full, unfiltered dataset. */
  data: T[];
  /** Dataset filtered by current searchTerm. Equals data when no filterFn or searchTerm. */
  filteredData: T[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  /** Re-runs fetchFn. Stable reference — safe to use as a useEffect dependency. */
  refresh: () => Promise<void>;
  /** Direct setter for optimistic updates (add/remove without re-fetching). */
  setData: Dispatch<SetStateAction<T[]>>;
}

function useAdminData<T>({
  fetchFn,
  filterFn,
  initialData,
  fetchOnMount = true,
}: UseAdminDataOptions<T>): UseAdminDataResult<T> {
  const [data, setData] = useState<T[]>(initialData ?? []);
  const [loading, setLoading] = useState(fetchOnMount && !initialData);
  const [searchTerm, setSearchTerm] = useState('');

  // Keep a ref so refresh() always calls the latest fetchFn without being
  // recreated on every render (avoids stale closure / infinite effect loops).
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchFnRef.current();
      setData(result);
    } catch (error) {
      notifyAboutError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetchOnMount) {
      refresh();
    }
    // refresh is stable. fetchOnMount is a mount-time constant — intentionally
    // omitted from deps so this only fires once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredData =
    filterFn && searchTerm
      ? data.filter(item => filterFn(item, searchTerm))
      : data;

  return { data, filteredData, loading, searchTerm, setSearchTerm, refresh, setData };
}

export default useAdminData;

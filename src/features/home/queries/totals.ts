import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

interface TotalType {
  count?: number;
  totalInUSD?: number;
}

const fetchTotals = async (): Promise<TotalType> => {
  const { data } = await api.get('/api/homepage/stats');
  return data;
};

export const totalsQuery = queryOptions({
  queryKey: ['totals'],
  queryFn: fetchTotals,
  staleTime: 1000 * 60 * 60,
  gcTime: 1000 * 60 * 60 * 2,
});

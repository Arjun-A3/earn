import {
  type GrantApplication,
  type GrantApplicationStatus,
  type GrantTranche,
  type GrantTrancheStatus,
} from '@prisma/client';
import { queryOptions } from '@tanstack/react-query';

import { api } from '@/lib/api';

import { type Grant } from '@/features/grants/types';

export interface GrantTrancheWithApplication extends GrantTranche {
  GrantApplication: GrantApplication & {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      photo: string | null;
      walletAddress: string;
      discord: string | null;
      username: string | null;
      twitter: string | null;
      telegram: string | null;
      website: string | null;
      Submission: {
        isWinner: boolean;
        rewardInUSD: number | null;
        listing: {
          isWinnersAnnounced: boolean;
        };
      }[];
      GrantApplication: {
        approvedAmountInUSD: number | null;
        applicationStatus: GrantApplicationStatus;
      }[];
    };
    grant: Grant;
  };
  totalEarnings: number;
  data: GrantTrancheWithApplication[];
  count: number;
}

interface TrancheParams {
  searchText: string;
  length: number;
  skip: number;
  filterLabel: GrantTrancheStatus | undefined;
}

export interface TranchesReturn {
  data: GrantTrancheWithApplication[];
  count: number;
}

const fetchTranches = async (params: TrancheParams, slug: string) => {
  const { data } = await api.get<TranchesReturn>(
    `/api/sponsor-dashboard/grants/${slug}/tranches/`,
    { params },
  );
  return data;
};

export const tranchesQuery = (slug: string, params: TrancheParams) =>
  queryOptions({
    queryKey: ['sponsor-tranches', slug, params],
    queryFn: () => fetchTranches(params, slug),
  });

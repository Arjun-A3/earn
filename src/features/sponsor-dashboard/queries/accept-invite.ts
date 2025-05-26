import { queryOptions } from '@tanstack/react-query';
import axios from 'axios';

import { api } from '@/lib/api';

interface InviteDetails {
  sponsorName: string;
  senderName: string;
  memberType: string;
  sponsorLogo: string;
  invitedEmail: string;
}

const verifyInvite = async (token: string): Promise<InviteDetails> => {
  try {
    const { data } = await api.get<InviteDetails>(
      '/api/member-invites/verify',
      {
        params: { token },
      },
    );
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error || 'Invalid or expired invitation',
      );
    }
    throw error;
  }
};

export const acceptInvite = async (token: string): Promise<void> => {
  try {
    await api.post('/api/member-invites/accept', { token });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error || 'Failed to accept invitation',
      );
    }
    throw error;
  }
};

export const verifyInviteQuery = (token: string) =>
  queryOptions({
    queryKey: ['inviteDetails', token],
    queryFn: () => verifyInvite(token),
    enabled: !!token,
    retry: false,
  });

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';

export interface FriendInvitationAcceptResponse {
  friendship: {
    id: string;
    userAId: string;
    userBId: string;
    createdAt: string;
  };
  invitation: {
    id: string;
    status: string;
    inviter: {
      name: string;
      email: string;
    };
  };
}

export const friendsApi = createApi({
  reducerPath: 'friendsApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    acceptFriendInvitation: builder.mutation<FriendInvitationAcceptResponse, { token: string }>({
      query: (body) => ({
        url: '/user/friends/invitations/accept',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { data?: FriendInvitationAcceptResponse } | FriendInvitationAcceptResponse) => {
        if (response && typeof response === 'object' && 'data' in response && response.data) {
          return response.data;
        }
        return response as FriendInvitationAcceptResponse;
      },
    }),
  }),
});

export const { useAcceptFriendInvitationMutation } = friendsApi;

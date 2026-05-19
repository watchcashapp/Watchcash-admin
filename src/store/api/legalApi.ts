import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';

export interface LegalDocument {
    title?: string;
    bodyHtml: string;
}

export interface LegalDocumentResponse {
    status: string;
    data: {
        terms?: LegalDocument;
        privacy?: LegalDocument;
    };
}

export const legalApi = createApi({
    reducerPath: 'legalApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Legal'],
    endpoints: (builder) => ({
        getAdminTerms: builder.query<LegalDocument, void>({
            query: () => '/admin/legal/terms',
            providesTags: ['Legal'],
            transformResponse: (response: { data: LegalDocument }) => response.data,
        }),
        getAdminPrivacy: builder.query<LegalDocument, void>({
            query: () => '/admin/legal/privacy',
            providesTags: ['Legal'],
            transformResponse: (response: { data: LegalDocument }) => response.data,
        }),
        updateTerms: builder.mutation<void, LegalDocument>({
            query: (body) => ({
                url: '/admin/legal/terms',
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['Legal'],
        }),
        updatePrivacy: builder.mutation<void, LegalDocument>({
            query: (body) => ({
                url: '/admin/legal/privacy',
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['Legal'],
        }),
        getPublicTerms: builder.query<LegalDocument, void>({
            query: () => '/legal/terms',
            providesTags: ['Legal'],
            transformResponse: (response: { data: LegalDocument }) => response.data,
        }),
        getPublicPrivacy: builder.query<LegalDocument, void>({
            query: () => '/legal/privacy',
            providesTags: ['Legal'],
            transformResponse: (response: { data: LegalDocument }) => response.data,
        }),
    }),
});

export const {
    useGetAdminTermsQuery,
    useGetAdminPrivacyQuery,
    useGetPublicTermsQuery,
    useGetPublicPrivacyQuery,
    useUpdateTermsMutation,
    useUpdatePrivacyMutation,
} = legalApi;

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
        getLegalDocs: builder.query<{ terms?: LegalDocument; privacy?: LegalDocument }, void>({
            query: () => '/admin/legal',
            providesTags: ['Legal'],
            transformResponse: (response: LegalDocumentResponse) => response.data,
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
    }),
});

export const {
    useGetLegalDocsQuery,
    useUpdateTermsMutation,
    useUpdatePrivacyMutation,
} = legalApi;

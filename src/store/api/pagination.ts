export interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
}

export interface CursorPaginationMeta {
  nextCursor: string | null;
  hasMore: boolean;
  total: number | null;
  limit: number | null;
}

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as UnknownRecord;
  }

  return {};
};

const readString = (record: UnknownRecord, keys: string[]): string | null => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }

  return null;
};

const readBoolean = (record: UnknownRecord, keys: string[]): boolean | undefined => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') {
      return value;
    }
  }

  return undefined;
};

const readNumber = (record: UnknownRecord, keys: string[]): number | null => {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      const parsedValue = Number(value);
      if (Number.isFinite(parsedValue)) {
        return parsedValue;
      }
    }
  }

  return null;
};

export const getResponseDataRoot = (response: unknown): UnknownRecord => {
  const responseRecord = asRecord(response);
  const dataRecord = asRecord(responseRecord.data);

  return Object.keys(dataRecord).length > 0 ? dataRecord : responseRecord;
};

export const getPaginationRecord = (root: UnknownRecord): UnknownRecord => asRecord(root.pagination);

export const normalizeCursorPaginationMeta = (
  source: unknown,
  fallbackLimit?: number,
): CursorPaginationMeta => {
  const root = getResponseDataRoot(source);
  const pagination = getPaginationRecord(root);

  const nextCursor = readString(root, ['nextCursor', 'next_cursor', 'nextcursor'])
    ?? readString(pagination, ['nextCursor', 'next_cursor', 'nextcursor']);

  const hasMore = readBoolean(root, ['hasMore', 'has_more', 'hasmore'])
    ?? readBoolean(pagination, ['hasMore', 'has_more', 'hasmore'])
    ?? Boolean(nextCursor);

  const total = readNumber(root, ['total', 'count'])
    ?? readNumber(pagination, ['total', 'count']);

  const limit = readNumber(root, ['limit'])
    ?? readNumber(pagination, ['limit'])
    ?? (typeof fallbackLimit === 'number' ? fallbackLimit : null);

  return {
    nextCursor,
    hasMore,
    total,
    limit,
  };
};

export const readCollection = <T>(root: UnknownRecord, keys: string[]): T[] => {
  for (const key of keys) {
    const value = root[key];
    if (Array.isArray(value)) {
      return value as T[];
    }
  }

  return [];
};

export const appendCursorPagination = (
  queryParams: URLSearchParams,
  params?: CursorPaginationParams,
): void => {
  if (params?.limit) {
    queryParams.set('limit', String(params.limit));
  }

  if (params?.cursor) {
    queryParams.set('cursor', params.cursor);
  }
};
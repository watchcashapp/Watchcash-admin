import { useCallback, useState } from 'react';

type CursorValue = string | undefined;

export interface CursorPaginationState {
  cursor: string | undefined;
  pageNumber: number;
  canGoBack: boolean;
  goNext: (nextCursor: string | null | undefined) => void;
  goPrevious: () => void;
  reset: () => void;
}

export function useCursorPagination(): CursorPaginationState {
  const [paginationState, setPaginationState] = useState<{
    cursorStack: CursorValue[];
    cursorIndex: number;
  }>({
    cursorStack: [undefined],
    cursorIndex: 0,
  });

  const goNext = useCallback((nextCursor: string | null | undefined) => {
    if (!nextCursor) {
      return;
    }

    setPaginationState((previousState) => ({
      cursorStack: [
        ...previousState.cursorStack.slice(0, previousState.cursorIndex + 1),
        nextCursor,
      ],
      cursorIndex: previousState.cursorIndex + 1,
    }));
  }, []);

  const goPrevious = useCallback(() => {
    setPaginationState((previousState) => ({
      ...previousState,
      cursorIndex: Math.max(previousState.cursorIndex - 1, 0),
    }));
  }, []);

  const reset = useCallback(() => {
    setPaginationState({
      cursorStack: [undefined],
      cursorIndex: 0,
    });
  }, []);

  const cursor = paginationState.cursorStack[paginationState.cursorIndex];

  return {
    cursor,
    pageNumber: paginationState.cursorIndex + 1,
    canGoBack: paginationState.cursorIndex > 0,
    goNext,
    goPrevious,
    reset,
  };
}
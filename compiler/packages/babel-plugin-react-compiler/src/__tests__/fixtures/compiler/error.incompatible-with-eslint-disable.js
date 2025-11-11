import {useVirtualizer} from '@tanstack/react-virtual';
import {useEffect} from 'react';

// This test verifies that incompatible-library warnings are shown
// even when eslint-disable-next-line is present for the entire function
// eslint-disable-next-line react-hooks/exhaustive-deps
export function useVirtualScroll({itemList, hasNextPage, isFetchingNextPage}) {
  const parentRef = {current: null};

  // This should trigger incompatible-library warning
  // even though the function has eslint-disable-next-line
  const rowVirtualizer = useVirtualizer({
    count: itemList.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
  });

  useEffect(() => {
    const virtualItems = rowVirtualizer.getVirtualItems();
    const lastItem = virtualItems[virtualItems.length - 1];
    if (lastItem && lastItem.index >= itemList.length - 5) {
      if (hasNextPage && !isFetchingNextPage) {
        // fetchNextPage();
      }
    }
  }, [hasNextPage, isFetchingNextPage, rowVirtualizer]);

  return {parentRef, rowVirtualizer};
}

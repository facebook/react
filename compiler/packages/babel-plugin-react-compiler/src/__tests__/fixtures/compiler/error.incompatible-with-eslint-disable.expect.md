
## Input

```javascript
import {useVirtualizer} from '@tanstack/react-virtual';
import {useEffect} from 'react';

// This test verifies that incompatible-library warnings are shown
// even when eslint-disable-next-line is present in the function
export function useVirtualScroll({itemList, hasNextPage, isFetchingNextPage}) {
  const parentRef = {current: null};
  
  // This should trigger incompatible-library warning
  const rowVirtualizer = useVirtualizer({
    count: itemList.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
  });
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const virtualItems = rowVirtualizer.getVirtualItems();
    const lastItem = virtualItems[virtualItems.length - 1];
    if (lastItem && lastItem.index >= itemList.length - 5) {
      if (hasNextPage && !isFetchingNextPage) {
        // fetchNextPage();
      }
    }
  }, [hasNextPage, isFetchingNextPage]);
  
  return {parentRef, rowVirtualizer};
}

```


## Error

```
Found 1 error:

Compilation Skipped: Use of incompatible library

⚠️  Incompatible API detected

This API cannot be safely memoized.

**Recommendation:**
Add "use no memo" directive to opt-out of memoization:

function useCustomHook() {
  "use no memo";
  const api = useIncompatibleAPI({...});
  ...
}

error.incompatible-with-eslint-disable.ts:10:25
   8 |   
   9 |   // This should trigger incompatible-library warning
> 10 |   const rowVirtualizer = useVirtualizer({
     |                          ^^^^^^^^^^^^^^^ TanStack Virtual's `useVirtualizer()` API returns functions that cannot be memoized safely
  11 |     count: itemList.length,
  12 |     getScrollElement: () => parentRef.current,
  13 |     estimateSize: () => 60,
```
          
      


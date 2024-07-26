
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees
import {useMemo} from 'react';

function useHook(maybeRef, shouldRead) {
  return useMemo(() => {
    return () => [maybeRef.current];
  }, [shouldRead, maybeRef]);
}

```


## Error

```
  3 |
  4 | function useHook(maybeRef, shouldRead) {
> 5 |   return useMemo(() => {
    |                  ^^^^^^^
> 6 |     return () => [maybeRef.current];
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 7 |   }, [shouldRead, maybeRef]);
    | ^^^^ CannotPreserveMemoization: React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected (5:7)
  8 | }
  9 |
```
          
      

## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees
import {useCallback} from 'react';

function useHook(maybeRef) {
  return useCallback(() => {
    return [maybeRef.current];
  }, [maybeRef]);
}

```


## Error

```
  3 |
  4 | function useHook(maybeRef) {
> 5 |   return useCallback(() => {
    |                      ^^^^^^^
> 6 |     return [maybeRef.current];
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 7 |   }, [maybeRef]);
    | ^^^^ CannotPreserveMemoization: React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected (5:7)
  8 | }
  9 |
```
          
      
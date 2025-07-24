
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
Found 1 error:

Memoization: Compilation skipped because existing memoization could not be preserved

React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `maybeRef.current`, but the source dependencies were [maybeRef]. Differences in ref.current access.

error.maybe-invalid-useCallback-read-maybeRef.ts:5:21
  3 |
  4 | function useHook(maybeRef) {
> 5 |   return useCallback(() => {
    |                      ^^^^^^^
> 6 |     return [maybeRef.current];
    | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 7 |   }, [maybeRef]);
    | ^^^^ Could not preserve existing manual memoization
  8 | }
  9 |
```
          
      
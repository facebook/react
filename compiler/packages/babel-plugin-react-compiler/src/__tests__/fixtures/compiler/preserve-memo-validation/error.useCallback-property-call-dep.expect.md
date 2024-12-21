
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees
import {useCallback} from 'react';

function Component({propA}) {
  return useCallback(() => {
    return propA.x();
  }, [propA.x]);
}

```


## Error

```
  3 |
  4 | function Component({propA}) {
> 5 |   return useCallback(() => {
    |                      ^^^^^^^
> 6 |     return propA.x();
    | ^^^^^^^^^^^^^^^^^^^^^
> 7 |   }, [propA.x]);
    | ^^^^ CannotPreserveMemoization: React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected (5:7)
  8 | }
  9 |
```
          
      
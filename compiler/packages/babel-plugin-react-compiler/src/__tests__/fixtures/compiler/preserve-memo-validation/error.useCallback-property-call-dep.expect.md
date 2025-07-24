
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
Found 1 error:
Memoization: React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected

The inferred dependency was `propA`, but the source dependencies were [propA.x]. Inferred less specific property than source.

error.useCallback-property-call-dep.ts:5:21
  3 |
  4 | function Component({propA}) {
> 5 |   return useCallback(() => {
    |                      ^^^^^^^
> 6 |     return propA.x();
    | ^^^^^^^^^^^^^^^^^^^^^
> 7 |   }, [propA.x]);
    | ^^^^ React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected
  8 | }
  9 |


```
          
      
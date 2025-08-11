
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees
import {useCallback} from 'react';
import {mutate} from 'shared-runtime';

function Component({propA, propB}) {
  return useCallback(() => {
    const x = {};
    if (propA?.a) {
      mutate(x);
      return {
        value: propB.x.y,
      };
    }
  }, [propA?.a, propB.x.y]);
}

```


## Error

```
Found 1 error:

Memoization: Compilation skipped because existing memoization could not be preserved

React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `propB`, but the source dependencies were [propA?.a, propB.x.y]. Inferred less specific property than source.

error.useCallback-infer-less-specific-conditional-access.ts:6:21
   4 |
   5 | function Component({propA, propB}) {
>  6 |   return useCallback(() => {
     |                      ^^^^^^^
>  7 |     const x = {};
     | ^^^^^^^^^^^^^^^^^
>  8 |     if (propA?.a) {
     | ^^^^^^^^^^^^^^^^^
>  9 |       mutate(x);
     | ^^^^^^^^^^^^^^^^^
> 10 |       return {
     | ^^^^^^^^^^^^^^^^^
> 11 |         value: propB.x.y,
     | ^^^^^^^^^^^^^^^^^
> 12 |       };
     | ^^^^^^^^^^^^^^^^^
> 13 |     }
     | ^^^^^^^^^^^^^^^^^
> 14 |   }, [propA?.a, propB.x.y]);
     | ^^^^ Could not preserve existing manual memoization
  15 | }
  16 |
```
          
      
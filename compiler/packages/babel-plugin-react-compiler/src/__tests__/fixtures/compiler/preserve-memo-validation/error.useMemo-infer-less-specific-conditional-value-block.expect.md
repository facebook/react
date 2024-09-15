
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees
import {useMemo} from 'react';
import {identity, mutate} from 'shared-runtime';

function Component({propA, propB}) {
  return useMemo(() => {
    const x = {};
    if (identity(null) ?? propA.a) {
      mutate(x);
      return {
        value: propB.x.y,
      };
    }
  }, [propA.a, propB.x.y]);
}

```


## Error

```
   4 |
   5 | function Component({propA, propB}) {
>  6 |   return useMemo(() => {
     |                  ^^^^^^^
>  7 |     const x = {};
     | ^^^^^^^^^^^^^^^^^
>  8 |     if (identity(null) ?? propA.a) {
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
> 14 |   }, [propA.a, propB.x.y]);
     | ^^^^ CannotPreserveMemoization: React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected (6:14)

CannotPreserveMemoization: React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected (6:14)
  15 | }
  16 |
```
          
      
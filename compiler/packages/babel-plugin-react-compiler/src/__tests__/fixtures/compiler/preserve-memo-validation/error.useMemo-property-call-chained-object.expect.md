
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees
import {useMemo} from 'react';

function Component({propA}) {
  return useMemo(() => {
    return {
      value: propA.x().y,
    };
  }, [propA.x]);
}

```


## Error

```
   3 |
   4 | function Component({propA}) {
>  5 |   return useMemo(() => {
     |                  ^^^^^^^
>  6 |     return {
     | ^^^^^^^^^^^^
>  7 |       value: propA.x().y,
     | ^^^^^^^^^^^^
>  8 |     };
     | ^^^^^^^^^^^^
>  9 |   }, [propA.x]);
     | ^^^^ CannotPreserveMemoization: React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected (5:9)
  10 | }
  11 |
```
          
      
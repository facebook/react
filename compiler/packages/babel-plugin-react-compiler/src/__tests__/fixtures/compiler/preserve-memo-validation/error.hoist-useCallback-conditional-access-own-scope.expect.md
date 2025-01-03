
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees
import {useCallback} from 'react';

function Component({propA, propB}) {
  return useCallback(() => {
    if (propA) {
      return {
        value: propB.x.y,
      };
    }
  }, [propA, propB.x.y]);
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{propA: 1, propB: {x: {y: []}}}],
};

```


## Error

```
   3 |
   4 | function Component({propA, propB}) {
>  5 |   return useCallback(() => {
     |                      ^^^^^^^
>  6 |     if (propA) {
     | ^^^^^^^^^^^^^^^^
>  7 |       return {
     | ^^^^^^^^^^^^^^^^
>  8 |         value: propB.x.y,
     | ^^^^^^^^^^^^^^^^
>  9 |       };
     | ^^^^^^^^^^^^^^^^
> 10 |     }
     | ^^^^^^^^^^^^^^^^
> 11 |   }, [propA, propB.x.y]);
     | ^^^^ CannotPreserveMemoization: React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected (5:11)
  12 | }
  13 |
  14 | export const FIXTURE_ENTRYPOINT = {
```
          
      
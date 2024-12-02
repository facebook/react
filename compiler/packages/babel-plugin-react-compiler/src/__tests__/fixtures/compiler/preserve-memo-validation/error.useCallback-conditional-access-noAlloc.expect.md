
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees
import {useCallback} from 'react';

function Component({propA, propB}) {
  return useCallback(() => {
    return {
      value: propB?.x.y,
      other: propA,
    };
  }, [propA, propB.x.y]);
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{propA: 2, propB: {x: {y: []}}}],
};

```


## Error

```
   3 |
   4 | function Component({propA, propB}) {
>  5 |   return useCallback(() => {
     |                      ^^^^^^^
>  6 |     return {
     | ^^^^^^^^^^^^
>  7 |       value: propB?.x.y,
     | ^^^^^^^^^^^^
>  8 |       other: propA,
     | ^^^^^^^^^^^^
>  9 |     };
     | ^^^^^^^^^^^^
> 10 |   }, [propA, propB.x.y]);
     | ^^^^ CannotPreserveMemoization: React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected (5:10)
  11 | }
  12 |
  13 | export const FIXTURE_ENTRYPOINT = {
```
          
      

## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees
import {useCallback} from 'react';
import {identity, mutate} from 'shared-runtime';

function useHook(propA, propB) {
  return useCallback(() => {
    const x = {};
    if (identity(null) ?? propA.a) {
      mutate(x);
      return {
        value: propB.x.y,
      };
    }
  }, [propA.a, propB.x.y]);
}

export const FIXTURE_ENTRYPOINT = {
  fn: useHook,
  params: [{a: 1}, {x: {y: 3}}],
};

```


## Error

```
   4 |
   5 | function useHook(propA, propB) {
>  6 |   return useCallback(() => {
     |                      ^^^^^^^
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
     | ^^^^ CannotPreserveMemoization: React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `propA`, but the source dependencies were [propA.a, propB.x.y]. Inferred less specific property than source (6:14)

CannotPreserveMemoization: React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `propB`, but the source dependencies were [propA.a, propB.x.y]. Inferred less specific property than source (6:14)
  15 | }
  16 |
  17 | export const FIXTURE_ENTRYPOINT = {
```
          
      
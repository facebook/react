
## Input

```javascript
import {identity} from 'shared-runtime';
function useInvalid() {
  const x = identity(x);
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useInvalid,
  params: [],
};

```


## Error

```
Found 1 error:

Invariant: [InferMutationAliasingEffects] Expected value kind to be initialized

<unknown> x$1.

error.dont-hoist-inline-reference.ts:3:21
  1 | import {identity} from 'shared-runtime';
  2 | function useInvalid() {
> 3 |   const x = identity(x);
    |                      ^ this is uninitialized
  4 |   return x;
  5 | }
  6 |
```
          
      
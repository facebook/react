
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees
import { useMemo } from "react";
import { identity } from "shared-runtime";

// This is a false positive as Forget's inferred memoization
// invalidates strictly less than source. We currently do not
// track transitive deps / invalidations of manual memo deps
// because of implementation complexity
function useFoo() {
  const val = [1, 2, 3];

  return useMemo(() => {
    return identity(val);
  }, [val]);
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [],
};

```


## Error

```
  10 |   const val = [1, 2, 3];
  11 |
> 12 |   return useMemo(() => {
     |                  ^^^^^^^
> 13 |     return identity(val);
     | ^^^^^^^^^^^^^^^^^^^^^^^^^
> 14 |   }, [val]);
     | ^^^^ [ReactForget] InvalidReact: This value was manually memoized, but cannot be memoized under Forget because it may be mutated after it is memoized (12:14)
  15 | }
  16 |
  17 | export const FIXTURE_ENTRYPOINT = {
```
          
      
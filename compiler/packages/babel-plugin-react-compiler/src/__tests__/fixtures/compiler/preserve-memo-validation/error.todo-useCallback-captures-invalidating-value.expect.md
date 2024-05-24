
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees

import { useCallback } from "react";

// False positive:
// We currently bail out on this because we don't understand
// that `() => [x]` gets pruned because `x` always invalidates.
function useFoo(props) {
  const x = [];
  useHook();
  x.push(props);

  return useCallback(() => [x], [x]);
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{}],
};

```


## Error

```
  11 |   x.push(props);
  12 |
> 13 |   return useCallback(() => [x], [x]);
     |                      ^^^^^^^^^ Invariant: Unexpected mismatch between StartMemoize and FinishMemoize. Encountered StartMemoize id=undefined followed by FinishMemoize id=0 (13:13)
  14 | }
  15 |
  16 | export const FIXTURE_ENTRYPOINT = {
```
          
      
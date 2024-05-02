
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees

import { useCallback } from "react";

// It's correct to produce memo blocks with fewer deps than source
function useFoo(a, b) {
  return useCallback(() => [a], [a, b]);
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [1, 2],
};

```

## Code

```javascript
// @validatePreserveExistingMemoizationGuarantees

import { useCallback, c as useMemoCache } from "react";

// It's correct to produce memo blocks with fewer deps than source
function useFoo(a, b) {
  const $ = useMemoCache(2);
  let t0;
  if ($[0] !== a) {
    t0 = () => [a];
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [1, 2],
};

```
      
### Eval output
(kind: ok) "[[ function params=0 ]]"
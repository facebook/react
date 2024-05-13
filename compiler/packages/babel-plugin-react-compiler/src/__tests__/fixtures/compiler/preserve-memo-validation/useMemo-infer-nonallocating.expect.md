
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees

import { useMemo } from "react";

// It's correct to infer a useMemo value is non-allocating
// and not provide it with a reactive scope
function useFoo(num1, num2) {
  return useMemo(() => Math.min(num1, num2), [num1, num2]);
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [2, 3],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validatePreserveExistingMemoizationGuarantees

import { useMemo } from "react";

// It's correct to infer a useMemo value is non-allocating
// and not provide it with a reactive scope
function useFoo(num1, num2) {
  const $ = _c(3);
  let t0;
  let t1;
  if ($[0] !== num1 || $[1] !== num2) {
    t1 = Math.min(num1, num2);
    $[0] = num1;
    $[1] = num2;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  t0 = t1;
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [2, 3],
};

```
      
### Eval output
(kind: ok) 2
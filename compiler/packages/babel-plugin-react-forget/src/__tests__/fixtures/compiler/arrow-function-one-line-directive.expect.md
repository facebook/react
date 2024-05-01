
## Input

```javascript
function useFoo() {
  const update = () => {
    "worklet";
    return 1;
  };
  return update;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [],
  isComponent: false,
};

```

## Code

```javascript
import { c as useMemoCache } from "react";
function useFoo() {
  const $ = useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      "worklet";
      return 1;
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const update = t0;
  return update;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [],
  isComponent: false,
};

```
      
### Eval output
(kind: ok) "[[ function params=0 ]]"
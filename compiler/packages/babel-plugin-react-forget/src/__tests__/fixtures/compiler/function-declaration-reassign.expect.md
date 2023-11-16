
## Input

```javascript
function component() {
  function x(a) {
    a.foo();
  }
  x = {};
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: [],
  isComponent: false,
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function component() {
  const $ = useMemoCache(1);
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = function x(a) {
      a.foo();
    };

    x = {};
    $[0] = x;
  } else {
    x = $[0];
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: [],
  isComponent: false,
};

```
      
### Eval output
(kind: ok) {}
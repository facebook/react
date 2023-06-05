
## Input

```javascript
// Valid because components can use hooks.
function createComponentWithHook() {
  return function ComponentWithHook() {
    useHook();
  };
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // Valid because components can use hooks.
function createComponentWithHook() {
  const $ = useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = function ComponentWithHook() {
      useHook();
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

```
      
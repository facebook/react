
## Input

```javascript
// Valid because hooks can use hooks.
function createHook() {
  return function useHookWithHook() {
    useHook();
  };
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // Valid because hooks can use hooks.
function createHook() {
  const $ = useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = function useHookWithHook() {
      useHook();
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

```
      
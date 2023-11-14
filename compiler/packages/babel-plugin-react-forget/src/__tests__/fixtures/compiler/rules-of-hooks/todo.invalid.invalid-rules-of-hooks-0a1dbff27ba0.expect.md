
## Input

```javascript
// @skip
// Passed but should have failed

// Invalid because it's dangerous and might not warn otherwise.
// This *must* be invalid.
function createHook() {
  return function useHookWithConditionalHook() {
    if (cond) {
      useConditionalHook();
    }
  };
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @skip
// Passed but should have failed

// Invalid because it's dangerous and might not warn otherwise.
// This *must* be invalid.
function createHook() {
  const $ = useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = function useHookWithConditionalHook() {
      if (cond) {
        useConditionalHook();
      }
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

```
      
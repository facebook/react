
## Input

```javascript
// @skip
// Passed but should have failed

// Invalid because it's a common misunderstanding.
// We *could* make it valid but the runtime error could be confusing.
function createComponent() {
  return function ComponentWithHookInsideCallback() {
    function handleClick() {
      useState();
    }
  };
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @skip
// Passed but should have failed

// Invalid because it's a common misunderstanding.
// We *could* make it valid but the runtime error could be confusing.
function createComponent() {
  const $ = useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = function ComponentWithHookInsideCallback() {};
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

```
      
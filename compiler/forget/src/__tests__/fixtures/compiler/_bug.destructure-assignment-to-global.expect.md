
## Input

```javascript
function useFoo(props) {
  [x] = props;
  return { x };
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function useFoo(props) {
  const $ = useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = { x };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

```
      
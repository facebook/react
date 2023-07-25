
## Input

```javascript
function Foo() {
  const [x, setX] = React.useState(1);
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Foo() {
  const $ = useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = React.useState(1);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const [x] = t0;
  return x;
}

```
      
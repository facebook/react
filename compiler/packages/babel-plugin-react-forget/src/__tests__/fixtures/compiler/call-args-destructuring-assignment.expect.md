
## Input

```javascript
function Component(props) {
  let x = makeObject();
  x.foo(([x] = makeObject()));
  return x;
}

```

## Code

```javascript
import { c as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(1);
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = makeObject();
    x.foo(([x] = makeObject()));
    $[0] = x;
  } else {
    x = $[0];
  }
  return x;
}

```
      
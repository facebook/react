
## Input

```javascript
// x's mutable range should extend to `mutate(y)`

function Component(props) {
  let x = [42, {}];
  const idx = foo(props.b);
  let y = x.at(idx);
  mutate(y);

  return x;
}

```

## Code

```javascript
import * as React from "react"; // x's mutable range should extend to `mutate(y)`

function Component(props) {
  const $ = React.unstable_useMemoCache(2);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = {};
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = [42, t0];
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const x = t1;
  const idx = foo(props.b);
  const y = x.at(idx);
  mutate(y);
  return x;
}

```
      
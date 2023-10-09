
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
import { unstable_useMemoCache as useMemoCache } from "react"; // x's mutable range should extend to `mutate(y)`

function Component(props) {
  const $ = useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = [42, {}];
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const x = t0;
  const idx = foo(props.b);
  const y = x.at(idx);
  mutate(y);
  return x;
}

```
      
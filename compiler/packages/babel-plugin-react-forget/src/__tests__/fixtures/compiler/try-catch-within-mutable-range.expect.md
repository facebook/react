
## Input

```javascript
function Component(props) {
  const x = [];
  try {
    x.push(foo());
  } catch {
    x.push(bar());
  }
  x.push(props.value); // extend the mutable range to include the try/catch
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(4);
  const c_0 = $[0] !== props.value;
  let x;
  if (c_0) {
    x = [];
    try {
      let t0;
      if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = foo();
        $[2] = t0;
      } else {
        t0 = $[2];
      }
      x.push(t0);
    } catch {
      let t1;
      if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = bar();
        $[3] = t1;
      } else {
        t1 = $[3];
      }
      x.push(t1);
    }

    x.push(props.value);
    $[0] = props.value;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      
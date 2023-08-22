
## Input

```javascript
export default function foo(x, y) {
  if (x) {
    return foo(false, y);
  }
  return [y * 10];
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
export default function foo(x, y) {
  const $ = useMemoCache(4);
  if (x) {
    const c_0 = $[0] !== y;
    let t0;
    if (c_0) {
      t0 = foo(false, y);
      $[0] = y;
      $[1] = t0;
    } else {
      t0 = $[1];
    }
    return t0;
  }

  const t1 = y * 10;
  const c_2 = $[2] !== t1;
  let t2;
  if (c_2) {
    t2 = [t1];
    $[2] = t1;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
}

```
      
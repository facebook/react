
## Input

```javascript
function foo(props) {
  let x = props.x;
  let y = x++;
  let z = x--;
  return { x, y, z };
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function foo(props) {
  const $ = useMemoCache(4);
  let x = props.x;
  const y = x++;
  const z = x--;
  const c_0 = $[0] !== x;
  const c_1 = $[1] !== y;
  const c_2 = $[2] !== z;
  let t0;
  if (c_0 || c_1 || c_2) {
    t0 = { x, y, z };
    $[0] = x;
    $[1] = y;
    $[2] = z;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  return t0;
}

```
      
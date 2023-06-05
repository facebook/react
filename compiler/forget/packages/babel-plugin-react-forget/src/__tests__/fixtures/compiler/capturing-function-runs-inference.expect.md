
## Input

```javascript
function component(a, b) {
  let z = { a };
  let p = () => <Foo>{z}</Foo>;
  return p();
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function component(a, b) {
  const $ = useMemoCache(6);
  const c_0 = $[0] !== a;
  let t0;
  if (c_0) {
    t0 = { a };
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const z = t0;
  const c_2 = $[2] !== z;
  let t1;
  if (c_2) {
    t1 = () => <Foo>{z}</Foo>;
    $[2] = z;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const p = t1;
  const c_4 = $[4] !== p;
  let t2;
  if (c_4) {
    t2 = p();
    $[4] = p;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  return t2;
}

```
      
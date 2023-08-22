
## Input

```javascript
function foo(cond) {
  let a = {};
  let b = {};
  let c = {};
  while (cond) {
    let z = a;
    a = b;
    b = c;
    c = z;
    mutate(a, b);
  }
  a;
  b;
  c;
  return a;
}

function mutate(x, y) {}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function foo(cond) {
  const $ = useMemoCache(2);
  const c_0 = $[0] !== cond;
  let a;
  if (c_0) {
    a = {};
    let b = {};
    let c = {};
    while (cond) {
      const z = a;
      a = b;
      b = c;
      c = z;
      mutate(a, b);
    }
    $[0] = cond;
    $[1] = a;
  } else {
    a = $[1];
  }
  return a;
}

function mutate(x, y) {}

```
      
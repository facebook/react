
## Input

```javascript
// Note that `a?.b.c` is semantically different from `(a?.b).c`
// We should codegen the correct member expressions
function Component(props) {
  let x = props?.b.c;
  let y = props?.b.c.d?.e.f.g?.h;
  return { x, y };
}

```

## Code

```javascript
import * as React from "react"; // Note that `a?.b.c` is semantically different from `(a?.b).c`
// We should codegen the correct member expressions
function Component(props) {
  const $ = React.unstable_useMemoCache(3);
  const x = props?.b.c;
  const y = props?.b.c.d?.e.f.g?.h;
  const c_0 = $[0] !== x;
  const c_1 = $[1] !== y;
  let t0;
  if (c_0 || c_1) {
    t0 = { x, y };
    $[0] = x;
    $[1] = y;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

```
      
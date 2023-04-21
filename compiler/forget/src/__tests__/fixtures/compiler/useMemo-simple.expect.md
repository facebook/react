
## Input

```javascript
function component(a) {
  let x = useMemo(() => [a], [a]);
  return <Foo x={x}></Foo>;
}

```

## Code

```javascript
import * as React from "react";
function component(a) {
  const $ = React.unstable_useMemoCache(4);
  const c_0 = $[0] !== a;
  let t0;
  if (c_0) {
    t0 = [a];
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const t10 = t0;
  const x = t10;
  const c_2 = $[2] !== x;
  let t1;
  if (c_2) {
    t1 = <Foo x={x} />;
    $[2] = x;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

```
      

## Input

```javascript
function g(props) {
  const a = { b: { c: props.c } };
  a.b.c = a.b.c + 1;
  a.b.c *= 2;
  return a;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function g(props) {
  const $ = useMemoCache(2);
  const c_0 = $[0] !== props.c;
  let a;
  if (c_0) {
    a = { b: { c: props.c } };
    a.b.c = a.b.c + 1;
    a.b.c = a.b.c * 2;
    $[0] = props.c;
    $[1] = a;
  } else {
    a = $[1];
  }
  return a;
}

```
      
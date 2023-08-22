
## Input

```javascript
// We should codegen nested optional properties correctly
// (i.e. placing `?` in the correct PropertyLoad)
function Component(props) {
  let x = foo(props.a?.b.c.d);
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // We should codegen nested optional properties correctly
// (i.e. placing `?` in the correct PropertyLoad)
function Component(props) {
  const $ = useMemoCache(2);
  const t0 = props.a?.b.c.d;
  const c_0 = $[0] !== t0;
  let t1;
  if (c_0) {
    t1 = foo(t0);
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const x = t1;
  return x;
}

```
      
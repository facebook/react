
## Input

```javascript
function Component(props) {
  const x = [0, ...props.foo, null, ...props.bar, "z"];
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(3);
  const c_0 = $[0] !== props.foo;
  const c_1 = $[1] !== props.bar;
  let t0;
  if (c_0 || c_1) {
    t0 = [0, ...props.foo, null, ...props.bar, "z"];
    $[0] = props.foo;
    $[1] = props.bar;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  const x = t0;
  return x;
}

```
      
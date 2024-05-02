
## Input

```javascript
function Component(props) {
  const x = foo[props.method](...props.a, null, ...props.b);
  return x;
}

```

## Code

```javascript
import { c as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(4);
  let t0;
  if ($[0] !== props.method || $[1] !== props.a || $[2] !== props.b) {
    t0 = foo[props.method](...props.a, null, ...props.b);
    $[0] = props.method;
    $[1] = props.a;
    $[2] = props.b;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  const x = t0;
  return x;
}

```
      

## Input

```javascript
function foo(props) {
  let x = [];
  x.push(props.bar);
  const _ = props.cond
    ? (({ x } = { x: {} }), ([x] = [[]]), x.push(props.foo))
    : null;
  console.log(_);
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function foo(props) {
  const $ = useMemoCache(4);
  const c_0 = $[0] !== props.bar;
  let x;
  if (c_0) {
    x = [];
    x.push(props.bar);
    $[0] = props.bar;
    $[1] = x;
  } else {
    x = $[1];
  }
  const c_2 = $[2] !== props;
  if (c_2) {
    const _ = props.cond ? (([x] = [[]]), x.push(props.foo)) : null;

    console.log(_);
    $[2] = props;
    $[3] = x;
  } else {
    x = $[3];
  }
  return x;
}

```
      
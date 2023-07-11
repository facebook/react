
## Input

```javascript
function foo(props) {
  let x = [];
  x.push(props.bar);
  props.cond ? ((x = {}), (x = []), x.push(props.foo)) : null;
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function foo(props) {
  const $ = useMemoCache(2);
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
  props.cond ? ((x = []), x.push(props.foo)) : null;
  return x;
}

```
      
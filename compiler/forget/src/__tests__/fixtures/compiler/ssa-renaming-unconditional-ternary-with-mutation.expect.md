
## Input

```javascript
function foo(props) {
  let x = [];
  x.push(props.bar);
  const _ = props.cond
    ? ((x = {}), (x = []), x.push(props.foo))
    : ((x = []), (x = []), x.push(props.bar));
  console.log(_);
  mut(x);
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function foo(props) {
  const $ = useMemoCache(2);
  const c_0 = $[0] !== props;
  let x;
  if (c_0) {
    x = [];
    x.push(props.bar);
    const _ = props.cond
      ? ((x = []), x.push(props.foo))
      : ((x = []), x.push(props.bar));
    console.log(_);
    mut(x);
    $[0] = props;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      
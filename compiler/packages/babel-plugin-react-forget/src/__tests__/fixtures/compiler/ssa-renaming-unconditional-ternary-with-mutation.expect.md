
## Input

```javascript
function foo(props) {
  let x = [];
  x.push(props.bar);
  props.cond
    ? ((x = {}), (x = []), x.push(props.foo))
    : ((x = []), (x = []), x.push(props.bar));
  mut(x);
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function foo(props) {
  const $ = useMemoCache(5);
  let x;
  if ($[0] !== props) {
    x = [];
    x.push(props.bar);
    if ($[2] !== props || $[3] !== x) {
      props.cond
        ? ((x = []), x.push(props.foo))
        : ((x = []), x.push(props.bar));
      mut(x);
      $[2] = props;
      $[3] = x;
      $[4] = x;
    } else {
      x = $[4];
    }
    $[0] = props;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      

## Input

```javascript
function Component(props) {
  const x = foo(...props.a, null, ...props.b);
  return x;
}

```

## Code

```javascript
import { c as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(3);
  let t0;
  if ($[0] !== props.a || $[1] !== props.b) {
    t0 = foo(...props.a, null, ...props.b);
    $[0] = props.a;
    $[1] = props.b;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  const x = t0;
  return x;
}

```
      

## Input

```javascript
function Component(props) {
  return call?.(props.a)?.(props.b)?.(props.c);
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(2);
  const c_0 = $[0] !== props;
  let t0;
  if (c_0) {
    t0 = call?.(props.a)?.(props.b)?.(props.c);
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      

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
  let t0;
  if ($[0] !== props) {
    t0 = call?.(props.a)?.(props.b)?.(props.c);
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      
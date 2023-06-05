
## Input

```javascript
function Component(props) {
  const x = { a: props.a, b: props.b };
  delete x.b;
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(3);
  const c_0 = $[0] !== props.a;
  const c_1 = $[1] !== props.b;
  let x;
  if (c_0 || c_1) {
    x = { a: props.a, b: props.b };
    delete x.b;
    $[0] = props.a;
    $[1] = props.b;
    $[2] = x;
  } else {
    x = $[2];
  }
  return x;
}

```
      
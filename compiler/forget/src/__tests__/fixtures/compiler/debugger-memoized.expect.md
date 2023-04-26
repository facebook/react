
## Input

```javascript
function Component(props) {
  const x = [];
  debugger;
  x.push(props.value);
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(2);
  const c_0 = $[0] !== props.value;
  let x;
  if (c_0) {
    x = [];
    debugger;

    x.push(props.value);
    $[0] = props.value;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      
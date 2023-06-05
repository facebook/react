
## Input

```javascript
function component(props) {
  // NOTE: the temporary for the leading space was previously dropped
  const x = isMenuShown ? <Bar> {props.a ? props.b : props.c}</Bar> : null;
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function component(props) {
  const $ = useMemoCache(2);
  const c_0 = $[0] !== props;
  let t0;
  if (c_0) {
    t0 = isMenuShown ? <Bar> {props.a ? props.b : props.c}</Bar> : null;
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const x = t0;
  return x;
}

```
      
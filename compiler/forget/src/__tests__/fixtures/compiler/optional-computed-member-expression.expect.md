
## Input

```javascript
function Component(props) {
  const object = makeObject(props);
  return object?.[props.key];
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(5);
  const c_0 = $[0] !== props;
  let t0;
  if (c_0) {
    t0 = makeObject(props);
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const object = t0;
  const c_2 = $[2] !== object;
  const c_3 = $[3] !== props;
  let t1;
  if (c_2 || c_3) {
    t1 = object?.[props.key];
    $[2] = object;
    $[3] = props;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}

```
      
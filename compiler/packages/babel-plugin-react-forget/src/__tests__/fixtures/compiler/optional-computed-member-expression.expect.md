
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
  let t0;
  if ($[0] !== props) {
    t0 = makeObject(props);
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const object = t0;
  let t1;
  if ($[2] !== object || $[3] !== props) {
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
      
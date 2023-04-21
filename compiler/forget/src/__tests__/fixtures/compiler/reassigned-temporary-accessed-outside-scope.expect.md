
## Input

```javascript
function Component(props) {
  const maybeMutable = new MaybeMutable();
  let x = props.value;
  return [x, maybeMutate(maybeMutable)];
}

```

## Code

```javascript
import * as React from "react";
function Component(props) {
  const $ = React.unstable_useMemoCache(6);
  const c_0 = $[0] !== props.value;
  let t0;
  let t1;
  if (c_0) {
    const maybeMutable = new MaybeMutable();
    const x = props.value;
    t0 = x;
    t1 = maybeMutate(maybeMutable);
    $[0] = props.value;
    $[1] = t0;
    $[2] = t1;
  } else {
    t0 = $[1];
    t1 = $[2];
  }
  const c_3 = $[3] !== t0;
  const c_4 = $[4] !== t1;
  let t2;
  if (c_3 || c_4) {
    t2 = [t0, t1];
    $[3] = t0;
    $[4] = t1;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  return t2;
}

```
      
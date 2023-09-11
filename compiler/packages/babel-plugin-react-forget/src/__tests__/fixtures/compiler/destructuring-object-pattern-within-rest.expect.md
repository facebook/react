
## Input

```javascript
function Component(props) {
  const [y, ...{ z }] = props.value;
  return [y, z];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: ["y", { z: "z!" }] }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(6);
  const c_0 = $[0] !== props.value;
  let t0;
  let y;
  if (c_0) {
    [y, ...t0] = props.value;
    $[0] = props.value;
    $[1] = t0;
    $[2] = y;
  } else {
    t0 = $[1];
    y = $[2];
  }
  const { z } = t0;
  const c_3 = $[3] !== y;
  const c_4 = $[4] !== z;
  let t1;
  if (c_3 || c_4) {
    t1 = [y, z];
    $[3] = y;
    $[4] = z;
    $[5] = t1;
  } else {
    t1 = $[5];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: ["y", { z: "z!" }] }],
};

```
      
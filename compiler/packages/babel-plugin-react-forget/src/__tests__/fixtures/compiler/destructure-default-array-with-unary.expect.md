
## Input

```javascript
function Component(props) {
  const [x = [-1, 1]] = props.value;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: [] }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(2);
  const [t0] = props.value;
  const c_0 = $[0] !== t0;
  let t1;
  if (c_0) {
    t1 = t0 === undefined ? [-1, 1] : t0;
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const x = t1;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: [] }],
};

```
      
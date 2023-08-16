
## Input

```javascript
function Component(props) {
  const x = [props.x];
  const index = 0;
  x[index] *= 2;
  x["0"] += 3;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ x: 2 }],
  isComponent: false,
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(2);
  const c_0 = $[0] !== props.x;
  let x;
  if (c_0) {
    x = [props.x];

    x[0] = x[0] * 2;
    x["0"] = x["0"] + 3;
    $[0] = props.x;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ x: 2 }],
  isComponent: false,
};

```
      
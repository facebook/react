
## Input

```javascript
const { mutate } = require("shared-runtime");

function Component(props) {
  const x = {};
  const y = props.y;
  const z = [x, y];
  mutate(z);
  // x's object identity can change bc it co-mutates with z, which is reactive via props.y
  return [x];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ y: 42 }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
const { mutate } = require("shared-runtime");

function Component(props) {
  const $ = useMemoCache(4);
  let x;
  if ($[0] !== props.y) {
    x = {};
    const y = props.y;
    const z = [x, y];
    mutate(z);
    $[0] = props.y;
    $[1] = x;
  } else {
    x = $[1];
  }
  let t0;
  if ($[2] !== x) {
    t0 = [x];
    $[2] = x;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ y: 42 }],
};

```
      
### Eval output
(kind: ok) [{}]
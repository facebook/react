
## Input

```javascript
function Component([b]) {
  let f = b--;
  let g = --b;
  return [b, f, g];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [[3]],
  isComponent: false,
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(t14) {
  const $ = useMemoCache(4);
  let [b] = t14;
  const f = b--;
  const g = --b;
  let t0;
  if ($[0] !== b || $[1] !== f || $[2] !== g) {
    t0 = [b, f, g];
    $[0] = b;
    $[1] = f;
    $[2] = g;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [[3]],
  isComponent: false,
};

```
      
### Eval output
(kind: ok) [1,3,1]
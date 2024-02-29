
## Input

```javascript
function Component({ c }) {
  let h = c++;
  let i = --c;
  return [c, h, i];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ c: 4 }],
  isComponent: false,
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(t14) {
  const $ = useMemoCache(4);
  let { c } = t14;
  const h = c++;
  const i = --c;
  let t0;
  if ($[0] !== c || $[1] !== h || $[2] !== i) {
    t0 = [c, h, i];
    $[0] = c;
    $[1] = h;
    $[2] = i;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ c: 4 }],
  isComponent: false,
};

```
      
### Eval output
(kind: ok) [4,4,4]
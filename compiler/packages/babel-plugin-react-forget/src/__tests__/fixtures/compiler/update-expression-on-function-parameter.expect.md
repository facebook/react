
## Input

```javascript
// @debug
function Component(a, [b], { c }) {
  let d = a++;
  let e = ++a;
  let f = b--;
  let g = --b;
  let h = c++;
  let i = --c;
  return [a, b, c, d, e, f, g, h, i];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [2, [3], { c: 4 }],
  isComponent: false,
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @debug
function Component(a, t37, t38) {
  const $ = useMemoCache(10);
  let [b] = t37;
  let { c } = t38;
  const d = a++;
  const e = ++a;
  const f = b--;
  const g = --b;
  const h = c++;
  const i = --c;
  let t0;
  if (
    $[0] !== a ||
    $[1] !== b ||
    $[2] !== c ||
    $[3] !== d ||
    $[4] !== e ||
    $[5] !== f ||
    $[6] !== g ||
    $[7] !== h ||
    $[8] !== i
  ) {
    t0 = [a, b, c, d, e, f, g, h, i];
    $[0] = a;
    $[1] = b;
    $[2] = c;
    $[3] = d;
    $[4] = e;
    $[5] = f;
    $[6] = g;
    $[7] = h;
    $[8] = i;
    $[9] = t0;
  } else {
    t0 = $[9];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [2, [3], { c: 4 }],
  isComponent: false,
};

```
      
### Eval output
(kind: ok) [4,1,4,2,4,3,1,4,4]
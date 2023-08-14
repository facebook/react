
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
  const c_0 = $[0] !== a;
  const c_1 = $[1] !== b;
  const c_2 = $[2] !== c;
  const c_3 = $[3] !== d;
  const c_4 = $[4] !== e;
  const c_5 = $[5] !== f;
  const c_6 = $[6] !== g;
  const c_7 = $[7] !== h;
  const c_8 = $[8] !== i;
  let t0;
  if (c_0 || c_1 || c_2 || c_3 || c_4 || c_5 || c_6 || c_7 || c_8) {
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

```
      
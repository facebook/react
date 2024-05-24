
## Input

```javascript
// @enableMemoizationComments
import { addOne, getNumber, identity } from "shared-runtime";

function Component(props) {
  const x = identity(props.a);
  const y = addOne(x);
  const z = identity(props.b);
  return [x, y, z];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 1, b: 10 }],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableMemoizationComments
import { addOne, getNumber, identity } from "shared-runtime";

function Component(props) {
  const $ = _c(9);
  let t0;
  let t1; // "useMemo" for t0 and t1:
  // check if props.a changed
  if ($[0] !== props.a) {
    // Inputs changed, recompute
    const x = identity(props.a);
    t1 = x;
    t0 = addOne(x);
    $[0] = props.a;
    $[1] = t0;
    $[2] = t1;
  } else {
    // Inputs did not change, use cached value
    t0 = $[1];
    t1 = $[2];
  }
  const y = t0;
  let t2; // "useMemo" for t2:
  // check if props.b changed
  if ($[3] !== props.b) {
    // Inputs changed, recompute
    t2 = identity(props.b);
    $[3] = props.b;
    $[4] = t2;
  } else {
    // Inputs did not change, use cached value
    t2 = $[4];
  }
  const z = t2;
  let t3; // "useMemo" for t3:
  // check if t1, y, or z changed
  if ($[5] !== t1 || $[6] !== y || $[7] !== z) {
    // Inputs changed, recompute
    t3 = [t1, y, z];
    $[5] = t1;
    $[6] = y;
    $[7] = z;
    $[8] = t3;
  } else {
    // Inputs did not change, use cached value
    t3 = $[8];
  }
  return t3;
}
export const FIXTURE_ENTRYPOINT = { fn: Component, params: [{ a: 1, b: 10 }] };

```
      
### Eval output
(kind: ok) [1,2,10]
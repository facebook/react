
## Input

```javascript
// props.b + 1 is an non-allocating expression, which means Forget can
// emit it trivially and repeatedly (e.g. no need to memoize props.b + 1
// separately from props.b)
// Correctness:
//   y depends on either props.b or props.b + 1
function PrimitiveAsDepNested(props) {
  let x = {};
  mutate(x);
  let y = foo(props.b + 1);
  mutate(x, props.a);
  return [x, y];
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // props.b + 1 is an non-allocating expression, which means Forget can
// emit it trivially and repeatedly (e.g. no need to memoize props.b + 1
// separately from props.b)
// Correctness:
//   y depends on either props.b or props.b + 1
function PrimitiveAsDepNested(props) {
  const $ = useMemoCache(7);
  const c_0 = $[0] !== props.b;
  const c_1 = $[1] !== props.a;
  let x;
  let y;
  let t2;
  if (c_0 || c_1) {
    x = {};
    mutate(x);
    const t0 = props.b + 1;
    const c_5 = $[5] !== t0;
    let t1;
    if (c_5) {
      t1 = foo(t0);
      $[5] = t0;
      $[6] = t1;
    } else {
      t1 = $[6];
    }
    y = t1;
    mutate(x, props.a);
    t2 = [x, y];
    $[0] = props.b;
    $[1] = props.a;
    $[2] = x;
    $[3] = y;
    $[4] = t2;
  } else {
    x = $[2];
    y = $[3];
    t2 = $[4];
  }
  return t2;
}

```
      
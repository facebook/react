
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
import { c as _c } from "react/compiler-runtime"; // props.b + 1 is an non-allocating expression, which means Forget can
// emit it trivially and repeatedly (e.g. no need to memoize props.b + 1
// separately from props.b)
// Correctness:
//   y depends on either props.b or props.b + 1
function PrimitiveAsDepNested(props) {
  const $ = _c(5);
  let t0;
  if ($[0] !== props.b || $[1] !== props.a) {
    const x = {};
    mutate(x);
    const t1 = props.b + 1;
    let t2;
    if ($[3] !== t1) {
      t2 = foo(t1);
      $[3] = t1;
      $[4] = t2;
    } else {
      t2 = $[4];
    }
    const y = t2;
    mutate(x, props.a);
    t0 = [x, y];
    $[0] = props.b;
    $[1] = props.a;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

```
      
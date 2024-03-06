
## Input

```javascript
// bar(props.b) is an allocating expression that produces a primitive, which means
// that Forget should memoize it.
// Correctness:
//   - y depends on either bar(props.b) or bar(props.b) + 1
function AllocatingPrimitiveAsDepNested(props) {
  let x = {};
  mutate(x);
  let y = foo(bar(props.b) + 1);
  mutate(x, props.a);
  return [x, y];
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // bar(props.b) is an allocating expression that produces a primitive, which means
// that Forget should memoize it.
// Correctness:
//   - y depends on either bar(props.b) or bar(props.b) + 1
function AllocatingPrimitiveAsDepNested(props) {
  const $ = useMemoCache(9);
  let x;
  let y;
  if ($[0] !== props.b || $[1] !== props.a) {
    x = {};
    mutate(x);
    const t0 = bar(props.b) + 1;
    let t1;
    if ($[4] !== t0) {
      t1 = foo(t0);
      $[4] = t0;
      $[5] = t1;
    } else {
      t1 = $[5];
    }
    y = t1;
    mutate(x, props.a);
    $[0] = props.b;
    $[1] = props.a;
    $[2] = x;
    $[3] = y;
  } else {
    x = $[2];
    y = $[3];
  }
  let t0;
  if ($[6] !== x || $[7] !== y) {
    t0 = [x, y];
    $[6] = x;
    $[7] = y;
    $[8] = t0;
  } else {
    t0 = $[8];
  }
  return t0;
}

```
      
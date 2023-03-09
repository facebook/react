
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
// bar(props.b) is an allocating expression that produces a primitive, which means
// that Forget should memoize it.
// Correctness:
//   - y depends on either bar(props.b) or bar(props.b) + 1
function AllocatingPrimitiveAsDepNested(props) {
  const $ = React.unstable_useMemoCache(9);
  const c_0 = $[0] !== props.b;
  const c_1 = $[1] !== props.a;
  let x;
  let y;
  if (c_0 || c_1) {
    x = {};
    mutate(x);
    const t0 = bar(props.b) + 1;
    const c_4 = $[4] !== t0;
    let t1;
    if (c_4) {
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
  const c_6 = $[6] !== x;
  const c_7 = $[7] !== y;
  let t2;
  if (c_6 || c_7) {
    t2 = [x, y];
    $[6] = x;
    $[7] = y;
    $[8] = t2;
  } else {
    t2 = $[8];
  }
  return t2;
}

```
      
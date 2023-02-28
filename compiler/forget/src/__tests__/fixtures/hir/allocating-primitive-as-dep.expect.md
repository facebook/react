
## Input

```javascript
// bar(props.b) is an allocating expression that produces a primitive, which means
// that Forget should memoize it.
// Correctness:
//   - y depends on either bar(props.b) or bar(props.b) + 1
function AllocatingPrimitiveAsDep(props) {
  let y = foo(bar(props).b + 1);
  return y;
}

function PrimitiveAsDepNested(props) {
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
function AllocatingPrimitiveAsDep(props) {
  const $ = React.unstable_useMemoCache(4);
  const c_0 = $[0] !== props;
  let t0;
  if (c_0) {
    t0 = bar(props);
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const t1 = t0.b + 1;
  const c_2 = $[2] !== t1;
  let y;
  if (c_2) {
    y = foo(t1);
    $[2] = t1;
    $[3] = y;
  } else {
    y = $[3];
  }
  return y;
}

function PrimitiveAsDepNested(props) {
  const $ = React.unstable_useMemoCache(10);
  const c_0 = $[0] !== props.b;
  const c_1 = $[1] !== props.a;
  let x;
  if (c_0 || c_1) {
    x = {};
    mutate(x);
    const c_3 = $[3] !== props.b;
    let t0;
    if (c_3) {
      t0 = bar(props.b);
      $[3] = props.b;
      $[4] = t0;
    } else {
      t0 = $[4];
    }
    const t1 = t0 + 1;
    const c_5 = $[5] !== t1;
    let y;
    if (c_5) {
      y = foo(t1);
      $[5] = t1;
      $[6] = y;
    } else {
      y = $[6];
    }
    mutate(x, props.a);
    $[0] = props.b;
    $[1] = props.a;
    $[2] = x;
  } else {
    x = $[2];
  }
  const c_7 = $[7] !== x;
  const c_8 = $[8] !== y;
  let t2;
  if (c_7 || c_8) {
    t2 = [x, y];
    $[7] = x;
    $[8] = y;
    $[9] = t2;
  } else {
    t2 = $[9];
  }
  return t2;
}

```
      
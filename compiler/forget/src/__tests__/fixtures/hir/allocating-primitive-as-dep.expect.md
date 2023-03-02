
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
  let t2;
  if (c_2) {
    t2 = foo(t1);
    $[2] = t1;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const y = t2;
  return y;
}

function PrimitiveAsDepNested(props) {
  const $ = React.unstable_useMemoCache(11);
  const c_0 = $[0] !== props.b;
  const c_1 = $[1] !== props.a;
  let x;
  let y;
  if (c_0 || c_1) {
    x = {};
    mutate(x);
    const c_4 = $[4] !== props.b;
    let t0;
    if (c_4) {
      t0 = bar(props.b);
      $[4] = props.b;
      $[5] = t0;
    } else {
      t0 = $[5];
    }
    const t1 = t0 + 1;
    const c_6 = $[6] !== t1;
    let t2;
    if (c_6) {
      t2 = foo(t1);
      $[6] = t1;
      $[7] = t2;
    } else {
      t2 = $[7];
    }
    y = t2;
    mutate(x, props.a);
    $[0] = props.b;
    $[1] = props.a;
    $[2] = x;
    $[3] = y;
  } else {
    x = $[2];
    y = $[3];
  }
  const c_8 = $[8] !== x;
  const c_9 = $[9] !== y;
  let t3;
  if (c_8 || c_9) {
    t3 = [x, y];
    $[8] = x;
    $[9] = y;
    $[10] = t3;
  } else {
    t3 = $[10];
  }
  return t3;
}

```
      
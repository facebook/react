
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
  const $ = React.unstable_useMemoCache(8);
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
    let y;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
      y = foo(t0 + 1);
      $[5] = y;
    } else {
      y = $[5];
    }
    mutate(x, props.a);
    $[0] = props.b;
    $[1] = props.a;
    $[2] = x;
  } else {
    x = $[2];
  }
  const c_6 = $[6] !== x;
  let t1;
  if (c_6) {
    t1 = [x, y];
    $[6] = x;
    $[7] = t1;
  } else {
    t1 = $[7];
  }
  return t1;
}

```
      

## Input

```javascript
// props.b + 1 is an non-allocating expression, which means Forget can
// emit it trivially and repeatedly (e.g. no need to memoize props.b + 1
// separately from props.b)
// Correctness:
//   y depends on either props.b or props.b + 1
function PrimitiveAsDep(props) {
  let y = foo(props.b + 1);
  return y;
}

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
// props.b + 1 is an non-allocating expression, which means Forget can
// emit it trivially and repeatedly (e.g. no need to memoize props.b + 1
// separately from props.b)
// Correctness:
//   y depends on either props.b or props.b + 1
function PrimitiveAsDep(props) {
  const $ = React.unstable_useMemoCache(2);
  const t0 = props.b + 1;
  const c_0 = $[0] !== t0;
  let y;
  if (c_0) {
    y = foo(t0);
    $[0] = t0;
    $[1] = y;
  } else {
    y = $[1];
  }
  return y;
}

function PrimitiveAsDepNested(props) {
  const $ = React.unstable_useMemoCache(6);
  const c_0 = $[0] !== props.b;
  const c_1 = $[1] !== props.a;
  let x;
  if (c_0 || c_1) {
    x = {};
    mutate(x);
    let y;
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
      y = foo(props.b + 1);
      $[3] = y;
    } else {
      y = $[3];
    }
    mutate(x, props.a);
    $[0] = props.b;
    $[1] = props.a;
    $[2] = x;
  } else {
    x = $[2];
  }
  const c_4 = $[4] !== x;
  let t0;
  if (c_4) {
    t0 = [x, y];
    $[4] = x;
    $[5] = t0;
  } else {
    t0 = $[5];
  }
  return t0;
}

```
      
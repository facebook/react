
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
  const $ = React.unstable_useMemoCache(8);
  const c_0 = $[0] !== props.b;
  const c_1 = $[1] !== props.a;
  let x;
  if (c_0 || c_1) {
    x = {};
    mutate(x);
    const t0 = props.b + 1;
    const c_3 = $[3] !== t0;
    let y;
    if (c_3) {
      y = foo(t0);
      $[3] = t0;
      $[4] = y;
    } else {
      y = $[4];
    }
    mutate(x, props.a);
    $[0] = props.b;
    $[1] = props.a;
    $[2] = x;
  } else {
    x = $[2];
  }
  const c_5 = $[5] !== x;
  const c_6 = $[6] !== y;
  let t1;
  if (c_5 || c_6) {
    t1 = [x, y];
    $[5] = x;
    $[6] = y;
    $[7] = t1;
  } else {
    t1 = $[7];
  }
  return t1;
}

```
      
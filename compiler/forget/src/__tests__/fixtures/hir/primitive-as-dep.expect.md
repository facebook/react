
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
  let t1;
  if (c_0) {
    t1 = foo(t0);
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const y = t1;
  return y;
}

```
      

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

```
      

## Input

```javascript
function Component(props) {
  // a can be independently memoized, is not mutated later
  const a = [props.a];

  // b and c are interleaved and grouped into a single scope,
  // but they are independent values. c does not escape, but
  // we need to ensure that a is memoized or else b will invalidate
  // on every render since a is a dependency.
  const b = [];
  const c = {};
  c.a = a;
  b.push(props.b);

  return b;
}

```

## Code

```javascript
function Component(props) {
  const $ = React.unstable_useMemoCache(5);
  const c_0 = $[0] !== props.a;
  let t0;
  if (c_0) {
    t0 = [props.a];
    $[0] = props.a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const a = t0;
  const c_2 = $[2] !== a;
  const c_3 = $[3] !== props.b;
  let b;
  if (c_2 || c_3) {
    b = [];
    const c = {};
    c.a = a;

    b.push(props.b);
    $[2] = a;
    $[3] = props.b;
    $[4] = b;
  } else {
    b = $[4];
  }
  return b;
}

```
      
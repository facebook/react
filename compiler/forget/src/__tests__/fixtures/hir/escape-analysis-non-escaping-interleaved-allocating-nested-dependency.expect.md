
## Input

```javascript
function Component(props) {
  // a can be independently memoized, is not mutated later
  // but a is a dependnecy of b, which is a dependency of c.
  // we have to memoize a to avoid breaking memoization of b,
  // to avoid breaking memoization of c.
  const a = [props.a];

  // a can be independently memoized, is not mutated later,
  // but is a dependency of d which is part of c's scope.
  // we have to memoize b to avoid breaking memoization of c.
  const b = [a];

  // c and d are interleaved and grouped into a single scope,
  // but they are independent values. d does not escape, but
  // we need to ensure that b is memoized or else b will invalidate
  // on every render since a is a dependency. we also need to
  // ensure that a is memoized, since it's a dependency of b.
  const c = [];
  const d = {};
  d.b = b;
  c.push(props.b);

  return c;
}

```

## Code

```javascript
function Component(props) {
  const $ = React.unstable_useMemoCache(7);
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
  let t1;
  if (c_2) {
    t1 = [a];
    $[2] = a;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const b = t1;
  const c_4 = $[4] !== b;
  const c_5 = $[5] !== props.b;
  let c;
  if (c_4 || c_5) {
    c = [];
    const d = {};
    d.b = b;

    c.push(props.b);
    $[4] = b;
    $[5] = props.b;
    $[6] = c;
  } else {
    c = $[6];
  }
  return c;
}

```
      
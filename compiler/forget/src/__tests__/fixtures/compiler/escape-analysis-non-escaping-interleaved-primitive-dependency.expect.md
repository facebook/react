
## Input

```javascript
function Component(props) {
  // a does not need to be memoized ever, even though it's a
  // dependency of c, which exists in a scope that has a memoized
  // output. it doesn't need to be memoized bc the value is a primitive type.
  const a = props.a + props.b;

  // b and c are interleaved and grouped into a single scope,
  // but they are independent values. c does not escape, but
  // we need to ensure that a is memoized or else b will invalidate
  // on every render since a is a dependency.
  const b = [];
  const c = {};
  c.a = a;
  b.push(props.c);

  return b;
}

```

## Code

```javascript
function Component(props) {
  const $ = React.unstable_useMemoCache(3);

  const a = props.a + props.b;
  const c_0 = $[0] !== a;
  const c_1 = $[1] !== props.c;
  let b;
  if (c_0 || c_1) {
    b = [];
    const c = {};
    c.a = a;
    b.push(props.c);
    $[0] = a;
    $[1] = props.c;
    $[2] = b;
  } else {
    b = $[2];
  }
  return b;
}

```
      
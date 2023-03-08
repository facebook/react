
## Input

```javascript
function component(a, b) {
  let z = { a };
  let p = () => <Foo>{z}</Foo>;
  return p();
}

```

## Code

```javascript
function component(a, b) {
  const $ = React.unstable_useMemoCache(4);
  const c_0 = $[0] !== a;
  let t0;
  if (c_0) {
    t0 = { a };
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const z = t0;
  const c_2 = $[2] !== z;
  let t1;
  if (c_2) {
    const p = () => <Foo>{z}</Foo>;
    t1 = p();
    $[2] = z;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

```
      
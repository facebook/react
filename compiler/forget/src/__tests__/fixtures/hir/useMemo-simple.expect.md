
## Input

```javascript
function component(a) {
  let x = useMemo(() => [a], [a]);
  return <Foo x={x}></Foo>;
}

```

## Code

```javascript
function component(a) {
  const $ = React.unstable_useMemoCache();
  const c_0 = $[0] !== a;
  let x;
  if (c_0) {
    x = (() => [a])();
    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }
  const c_2 = $[2] !== x;
  let t0;
  if (c_2) {
    t0 = <Foo x={x}></Foo>;
    $[2] = x;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  return t0;
}

```
      
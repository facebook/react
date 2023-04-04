
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
  const $ = React.unstable_useMemoCache(6);
  const c_0 = $[0] !== a;
  let t0;
  if (c_0) {
    t0 = () => [a];
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const c_2 = $[2] !== t0;
  let t1;
  if (c_2) {
    t1 = t0();
    $[2] = t0;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const x = t1;
  const c_4 = $[4] !== x;
  let t2;
  if (c_4) {
    t2 = <Foo x={x} />;
    $[4] = x;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  return t2;
}

```
      
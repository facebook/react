
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
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== a;
  let t0;
  if (c_0) {
    t0 = (() => [a])();
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const x = t0;
  return <Foo x={x}></Foo>;
}

```
      
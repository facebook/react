
## Input

```javascript
function component() {
  let [x, setX] = useState(0);
  const handler = (v) => setX(v);
  return <Foo handler={handler}></Foo>;
}

```

## Code

```javascript
function component() {
  const $ = React.useMemoCache();
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = useState(0);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const x = t0[0];
  const setX = t0[1];
  const c_1 = $[1] !== setX;
  let handler;
  if (c_1) {
    handler = (v) => setX(v);
    $[1] = setX;
    $[2] = handler;
  } else {
    handler = $[2];
  }
  const c_3 = $[3] !== handler;
  let t4;
  if (c_3) {
    t4 = <Foo handler={handler}></Foo>;
    $[3] = handler;
    $[4] = t4;
  } else {
    t4 = $[4];
  }
  return t4;
}

```
      
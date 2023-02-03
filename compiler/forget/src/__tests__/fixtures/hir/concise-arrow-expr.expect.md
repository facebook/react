
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
  let handler;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    handler = (v) => setX(v);
    $[1] = handler;
  } else {
    handler = $[1];
  }
  let t1;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = <Foo handler={handler}></Foo>;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

```
      
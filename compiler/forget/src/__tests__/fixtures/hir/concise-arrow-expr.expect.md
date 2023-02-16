
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
  const $ = React.unstable_useMemoCache(4);
  const setX = useState(0)[1];
  const c_0 = $[0] !== setX;
  let handler;
  if (c_0) {
    handler = (v) => setX(v);
    $[0] = setX;
    $[1] = handler;
  } else {
    handler = $[1];
  }
  const c_2 = $[2] !== handler;
  let t0;
  if (c_2) {
    t0 = <Foo handler={handler}></Foo>;
    $[2] = handler;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  return t0;
}

```
      
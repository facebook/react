
## Input

```javascript
function component() {
  let [x, setX] = useState(0);
  const handler = (event) => setX(event.target.value);
  return <input onChange={handler} value={x} />;
}

```

## Code

```javascript
function component() {
  const $ = React.unstable_useMemoCache(5);
  const t1 = useState(0);
  const x = t1[0];
  const setX = t1[1];
  const c_0 = $[0] !== setX;
  let handler;
  if (c_0) {
    handler = (event) => setX(event.target.value);
    $[0] = setX;
    $[1] = handler;
  } else {
    handler = $[1];
  }
  const c_2 = $[2] !== handler;
  const c_3 = $[3] !== x;
  let t0;
  if (c_2 || c_3) {
    t0 = <input onChange={handler} value={x}></input>;
    $[2] = handler;
    $[3] = x;
    $[4] = t0;
  } else {
    t0 = $[4];
  }
  return t0;
}

```
      
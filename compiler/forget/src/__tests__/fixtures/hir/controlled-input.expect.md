
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
  const [x, setX] = useState(0);
  const c_0 = $[0] !== setX;
  let t0;
  if (c_0) {
    t0 = (event) => setX(event.target.value);
    $[0] = setX;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const handler = t0;
  const c_2 = $[2] !== handler;
  const c_3 = $[3] !== x;
  let t1;
  if (c_2 || c_3) {
    t1 = <input onChange={handler} value={x}></input>;
    $[2] = handler;
    $[3] = x;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}

```
      
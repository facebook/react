
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
  const $ = React.unstable_useMemoCache(2);
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
  return <input onChange={handler} value={x}></input>;
}

```
      
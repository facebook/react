
## Input

```javascript
function Component(props) {
  const [x, setX] = useState(null);

  const onChange = (e) => {
    let x = null; // intentionally shadow the original x
    setX((currentX) => currentX + x); // intentionally refer to shadowed x
  };

  return <input value={x} onChange={onChange} />;
}

```

## Code

```javascript
function Component(props) {
  const $ = React.unstable_useMemoCache(5);
  const [x, setX] = useState(null);
  const c_0 = $[0] !== setX;
  let t0;
  if (c_0) {
    t0 = (e) => {
      let x_0 = null; // intentionally shadow the original x
      setX((currentX) => currentX + x_0); // intentionally refer to shadowed x
    };
    $[0] = setX;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const onChange = t0;
  const c_2 = $[2] !== x;
  const c_3 = $[3] !== onChange;
  let t1;
  if (c_2 || c_3) {
    t1 = <input value={x} onChange={onChange} />;
    $[2] = x;
    $[3] = onChange;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}

```
      
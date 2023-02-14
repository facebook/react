
## Input

```javascript
function component() {
  const [count, setCount] = useState(0);
  const increment = useCallback(() => setCount(count + 1));

  return <Foo onClick={increment}></Foo>;
}

```

## Code

```javascript
function component() {
  const $ = React.unstable_useMemoCache();
  const t2 = useState(0);
  const count = t2[0];
  const setCount = t2[1];
  const c_0 = $[0] !== setCount;
  const c_1 = $[1] !== count;
  let t0;
  if (c_0 || c_1) {
    t0 = () => setCount(count + 1);
    $[0] = setCount;
    $[1] = count;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  const increment = t0;
  const c_3 = $[3] !== increment;
  let t1;
  if (c_3) {
    t1 = <Foo onClick={increment}></Foo>;
    $[3] = increment;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}

```
      
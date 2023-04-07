
## Input

```javascript
function Component(props) {
  const [a, b] = useMemo(() => {
    const items = [];
    const a = makeObject(props.a);
    const b = makeObject(props.b);
    return [a, b];
  });
  return [a, b];
}

```

## Code

```javascript
function Component(props) {
  const $ = React.unstable_useMemoCache(7);
  const c_0 = $[0] !== props.a;
  let t0;
  if (c_0) {
    t0 = () => {
      const items = [];
      const a = makeObject(props.a);
      const b = makeObject(props.b);
      return [a, b];
    };
    $[0] = props.a;
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
  const [a_0, b_0] = t1;
  const c_4 = $[4] !== a_0;
  const c_5 = $[5] !== b_0;
  let t2;
  if (c_4 || c_5) {
    t2 = [a_0, b_0];
    $[4] = a_0;
    $[5] = b_0;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
}

```
      
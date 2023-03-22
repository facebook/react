
## Input

```javascript
function Component(props) {
  const a = [props.a, props.b, "hello"];
  const x = a.push(42);
  const y = a.at(props.c);

  return { a, x, y };
}

```

## Code

```javascript
function Component(props) {
  const $ = React.unstable_useMemoCache(10);
  const c_0 = $[0] !== props.a;
  const c_1 = $[1] !== props.b;
  const c_2 = $[2] !== props.c;
  let t0;
  let a;
  let x;
  if (c_0 || c_1 || c_2) {
    a = [props.a, props.b, "hello"];
    x = a.push(42);
    t0 = a.at(props.c);
    $[0] = props.a;
    $[1] = props.b;
    $[2] = props.c;
    $[3] = t0;
    $[4] = a;
    $[5] = x;
  } else {
    t0 = $[3];
    a = $[4];
    x = $[5];
  }
  const y = t0;
  const c_6 = $[6] !== a;
  const c_7 = $[7] !== x;
  const c_8 = $[8] !== y;
  let t1;
  if (c_6 || c_7 || c_8) {
    t1 = { a, x, y };
    $[6] = a;
    $[7] = x;
    $[8] = y;
    $[9] = t1;
  } else {
    t1 = $[9];
  }
  return t1;
}

```
      
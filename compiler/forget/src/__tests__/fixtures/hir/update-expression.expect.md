
## Input

```javascript
function foo(props) {
  let x = props.x;
  let y = x++;
  let z = x--;
  return { x, y, z };
}

```

## Code

```javascript
function foo(props) {
  const $ = React.unstable_useMemoCache();
  let x = props.x;
  x = x + 1;
  const y = x;
  x = x - 1;
  const z = x;
  const c_0 = $[0] !== x;
  const c_1 = $[1] !== y;
  const c_2 = $[2] !== z;
  let t0;
  if (c_0 || c_1 || c_2) {
    t0 = { x: x, y: y, z: z };
    $[0] = x;
    $[1] = y;
    $[2] = z;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  return t0;
}

```
      
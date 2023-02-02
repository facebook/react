
## Input

```javascript
function component(a, b) {
  let y = { a };
  let x = { b };
  x["y"] = y;
  mutate(x);
  return x;
}

```

## Code

```javascript
function component(a, b) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== a;
  const c_1 = $[1] !== b;
  let x;
  if (c_0 || c_1) {
    const y = { a: a };
    x = { b: b };
    x["y"] = y;

    mutate(x);
    $[0] = a;
    $[1] = b;
    $[2] = x;
  } else {
    x = $[2];
  }
  return x;
}

```
      
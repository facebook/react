
## Input

```javascript
function component(a) {
  let x = { a };
  let y = {};

  y.x = x["a"];
  mutate(y);
  return x;
}

```

## Code

```javascript
function component(a) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== a;
  let x;
  if (c_0) {
    x = { a: a };
    const y = {};
    y.x = x["a"];

    mutate(y);
    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      
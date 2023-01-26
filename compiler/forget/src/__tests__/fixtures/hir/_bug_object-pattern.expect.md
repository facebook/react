
## Input

```javascript
function component(t) {
  let { a } = t;
  let y = { a };
  return y;
}

```

## Code

```javascript
function component(t) {
  const $ = React.useMemoCache();
  const a = t.a;
  const c_0 = $[0] !== t6.a;
  let y;
  if (c_0) {
    y = { a: a };
    $[0] = t6.a;
    $[1] = y;
  } else {
    y = $[1];
  }
  return y;
}

```
      

## Input

```javascript
function component(a) {
  let x = "foo";
  if (a) {
    x = "bar";
  } else {
    x = "baz";
  }
  let y = x;
  mutate(y);
  return y;
}

```

## Code

```javascript
function component(a) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== a;
  let x;
  if (c_0) {
    x = undefined;
    if (a) {
      const x$0 = "bar";
      x = x$0;
    } else {
      const x$1 = "baz";
      x = x$1;
    }
    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }

  const y = x;
  mutate(y);
  return y;
}

```
      
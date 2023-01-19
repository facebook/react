
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
  const x = "foo";
  const c_0 = $[0] !== a;
  let x$0;
  if (c_0) {
    x$0 = undefined;
    if (a) {
      const x$1 = "bar";
      x$0 = x$1;
    } else {
      const x$2 = "baz";
      x$0 = x$2;
    }
    $[0] = a;
    $[1] = x$0;
  } else {
    x$0 = $[1];
  }

  const y = x$0;
  mutate(y);
  return y;
}

```
      
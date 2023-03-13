
## Input

```javascript
function f(a, b) {
  let x = []; // <- x starts being mutable here.
  if (a.length === 1) {
    if (b) {
      x.push(b); // <- x stops being mutable here.
    }
  }

  return <div>{x}</div>;
}

```

## Code

```javascript
function f(a, b) {
  const $ = React.unstable_useMemoCache(3);
  const c_0 = $[0] !== a.length;
  const c_1 = $[1] !== b;
  let x;
  if (c_0 || c_1) {
    x = [];
    if (a.length === 1) {
      if (b) {
        x.push(b);
      }
    }
    $[0] = a.length;
    $[1] = b;
    $[2] = x;
  } else {
    x = $[2];
  }
  return <div>{x}</div>;
}

```
      
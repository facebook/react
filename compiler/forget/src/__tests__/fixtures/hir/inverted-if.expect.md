
## Input

```javascript
function foo(a, b, c) {
  let y = [];
  label: if (a) {
    if (b) {
      y.push(c);
      break label;
    }
  }
  return y;
}

```

## Code

```javascript
function foo(a, b, c) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== a;
  const c_1 = $[1] !== b;
  const c_2 = $[2] !== c;
  let y;
  if (c_0 || c_1 || c_2) {
    y = [];

    if (a) {
      if (b) {
        y.push(c);
      }
    }

    $[0] = a;
    $[1] = b;
    $[2] = c;
    $[3] = y;
  } else {
    y = $[3];
  }

  return y;
}

```
      
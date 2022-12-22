
## Input

```javascript
function foo(a, b, c, d) {
  let x = 0;
  if (true) {
    if (true) {
      x = a;
    } else {
      x = b;
    }
    x;
  } else {
    if (true) {
      x = c;
    } else {
      x = d;
    }
    x;
  }
  return x;
}

```

## Code

```javascript
function foo(a, b, c, d) {
  const $ = React.useMemoCache();
  const x = 0;
  const c_0 = $[0] !== a;
  const c_1 = $[1] !== b;
  const c_2 = $[2] !== c;
  const c_3 = $[3] !== d;
  let x$0;
  if (c_0 || c_1 || c_2 || c_3) {
    x$0 = undefined;

    if (true) {
      if (true) {
        const x$1 = a;
        x$0 = x$1;
      } else {
        const x$2 = b;
        x$0 = x$2;
      }

      x$3;
      x$0 = x$3;
    } else {
      if (true) {
        const x$4 = c;
        x$0 = x$4;
      } else {
        const x$5 = d;
        x$0 = x$5;
      }

      x$6;
      x$0 = x$6;
    }

    $[0] = a;
    $[1] = b;
    $[2] = c;
    $[3] = d;
    $[4] = x$0;
  } else {
    x$0 = $[4];
  }

  return x$0;
}

```
      
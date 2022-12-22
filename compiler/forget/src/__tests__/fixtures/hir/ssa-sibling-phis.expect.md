
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
  // note: intentionally no phi here so that there are two distinct phis above
}

```

## Code

```javascript
function foo(a, b, c, d) {
  const $ = React.useMemoCache();
  const x = 0;
  if (true) {
    const c_0 = $[0] !== a;
    const c_1 = $[1] !== b;
    let x$0;

    if (c_0 || c_1) {
      x$0 = undefined;

      if (true) {
        const x$1 = a;
        x$0 = x$1;
      } else {
        const x$2 = b;
        x$0 = x$2;
      }

      $[0] = a;
      $[1] = b;
      $[2] = x$0;
    } else {
      x$0 = $[2];
    }

    x$0;
  } else {
    const c_3 = $[3] !== c;
    const c_4 = $[4] !== d;
    let x$3;

    if (c_3 || c_4) {
      x$3 = undefined;

      if (true) {
        const x$4 = c;
        x$3 = x$4;
      } else {
        const x$5 = d;
        x$3 = x$5;
      }

      $[3] = c;
      $[4] = d;
      $[5] = x$3;
    } else {
      x$3 = $[5];
    }

    x$3;
  }
}

```
      
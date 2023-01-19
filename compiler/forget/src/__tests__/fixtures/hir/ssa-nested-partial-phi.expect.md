
## Input

```javascript
function foo(a, b, c) {
  let x = a;
  if (b) {
    if (c) {
      x = c;
    }
    x;
  }
}

```

## Code

```javascript
function foo(a, b, c) {
  const $ = React.useMemoCache();
  const x = a;
  if (b) {
    const c_0 = $[0] !== c;
    let x$0;
    if (c_0) {
      x$0 = x;
      if (c) {
        const x$1 = c;
        x$0 = x$1;
      }
      $[0] = c;
      $[1] = x$0;
    } else {
      x$0 = $[1];
    }
    x$0;
  }
}

```
      
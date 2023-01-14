
## Input

```javascript
function component(a) {
  let z = { a };
  let x;
  {
    x = function () {
      z;
    };
  }
  return x;
}

```

## Code

```javascript
function component(a) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== a;
  let z;
  if (c_0) {
    z = {
      a: a,
    };
    $[0] = a;
    $[1] = z;
  } else {
    z = $[1];
  }

  const x = undefined;
  const c_2 = $[2] !== z;
  let x$0;

  if (c_2) {
    x$0 = function () {
      z;
    };

    $[2] = z;
    $[3] = x$0;
  } else {
    x$0 = $[3];
  }

  return x$0;
}

```
      
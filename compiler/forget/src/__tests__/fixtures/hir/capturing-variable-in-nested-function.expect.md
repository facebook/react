
## Input

```javascript
function component(a) {
  let z = { a };
  let x = function () {
    (function () {
      z;
    })();
  };
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

  const c_2 = $[2] !== z;
  let x;

  if (c_2) {
    x = function () {
      (function () {
        z;
      })();
    };

    $[2] = z;
    $[3] = x;
  } else {
    x = $[3];
  }

  return x;
}

```
      
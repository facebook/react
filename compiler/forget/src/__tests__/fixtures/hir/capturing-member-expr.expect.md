
## Input

```javascript
function component(a) {
  let z = { a };
  let x = function () {
    z.a;
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

  const c_2 = $[2] !== z.a;
  let x;

  if (c_2) {
    x = function () {
      z.a;
    };

    $[2] = z.a;
    $[3] = x;
  } else {
    x = $[3];
  }

  return x;
}

```
      
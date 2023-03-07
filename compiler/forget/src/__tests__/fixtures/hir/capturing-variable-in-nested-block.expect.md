
## Input

```javascript
function component(a) {
  let z = { a };
  let x = function () {
    {
      z;
    }
  };
  return x;
}

```

## Code

```javascript
function component(a) {
  const $ = React.unstable_useMemoCache(4);
  const c_0 = $[0] !== a;
  let t0;
  if (c_0) {
    t0 = { a };
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const z = t0;
  const c_2 = $[2] !== z;
  let t1;
  if (c_2) {
    t1 = function () {
      {
        z;
      }
    };
    $[2] = z;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const x = t1;
  return x;
}

```
      

## Input

```javascript
function foo(a) {
  const x = {};
  if (a) {
    let y = {};
    x.y = y;
  } else {
    let z = {};
    x.z = z;
  }
  mutate(x);
  return x;
}

```

## Code

```javascript
function foo(a) {
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== a;
  let x;
  if (c_0) {
    x = {};
    if (a) {
      const y = {};
      x.y = y;
    } else {
      const z = {};
      x.z = z;
    }

    mutate(x);
    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      
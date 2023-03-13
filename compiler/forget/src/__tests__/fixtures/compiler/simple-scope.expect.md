
## Input

```javascript
function foo(a) {
  const x = [a.b];
  return x;
}

```

## Code

```javascript
function foo(a) {
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== a.b;
  let t0;
  if (c_0) {
    t0 = [a.b];
    $[0] = a.b;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const x = t0;
  return x;
}

```
      
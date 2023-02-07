
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
  const $ = React.unstable_useMemoCache();
  const c_0 = $[0] !== a.b;
  let x;
  if (c_0) {
    x = [a.b];
    $[0] = a.b;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      
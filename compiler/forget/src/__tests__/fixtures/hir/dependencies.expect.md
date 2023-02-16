
## Input

```javascript
function foo(x, y, z) {
  const items = [z];
  items.push(x);

  const items2 = [];
  if (x) {
    items2.push(y);
  }

  if (y) {
    items.push(x);
  }

  return items2;
}

```

## Code

```javascript
function foo(x, y, z) {
  const $ = React.unstable_useMemoCache(3);
  const items = [z];
  items.push(x);
  const c_0 = $[0] !== x;
  const c_1 = $[1] !== y;
  let items2;
  if (c_0 || c_1) {
    items2 = [];
    if (x) {
      items2.push(y);
    }
    $[0] = x;
    $[1] = y;
    $[2] = items2;
  } else {
    items2 = $[2];
  }
  if (y) {
    items.push(x);
  }
  return items2;
}

```
      
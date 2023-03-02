
## Input

```javascript
function Component() {
  const x = [0, 1, 2, 3];
  const ret = [];
  do {
    const item = x.pop();
    if (item === 0) {
      continue;
    }
    ret.push(item / 2);
  } while (x.length);

  return ret;
}

```

## Code

```javascript
function Component() {
  const $ = React.unstable_useMemoCache(1);
  let ret;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const x = [0, 1, 2, 3];
    ret = [];
    do {
      const item = x.pop();
      if (item === 0) {
        continue;
      }

      ret.push(item / 2);
    } while (x.length);
    $[0] = ret;
  } else {
    ret = $[0];
  }
  return ret;
}

```
      
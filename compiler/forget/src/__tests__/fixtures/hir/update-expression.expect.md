
## Input

```javascript
function foo(props) {
  let x = props.x;
  let y = x++;
  let z = x--;
  return { x, y, z };
}

```

## Code

```javascript
function foo(props) {
  const $ = React.useMemoCache();
  const x = props.x;
  const x$0 = x + 1;
  const y = x$0;
  const x$1 = x$0 - 1;
  const z = x$1;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = { x: x$1, y: y, z: z };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

```
      
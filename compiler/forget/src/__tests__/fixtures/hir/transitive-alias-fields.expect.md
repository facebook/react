
## Input

```javascript
function component() {
  let x = {};
  let p = {};
  let q = {};
  let y = {};

  x.y = y;
  p.y = x.y;
  q.y = p.y;

  mutate(q);
}

```

## Code

```javascript
function component() {
  const $ = React.useMemoCache();
  const x = {};
  const p = {};
  const q = {};
  let y;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    y = {};
    $[0] = y;
  } else {
    y = $[0];
  }

  x.y = y;
  p.y = x.y;
  q.y = p.y;
  mutate(q);
}

```
      

## Input

```javascript
function g(a) {
  a.b.c = a.b.c + 1;
  a.b.c *= 2;
}

```

## Code

```javascript
function g(a) {
  const $ = React.useMemoCache();
  let a;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    a.c.b = a.b.c + 1;
    a.c.b = a.b.c * 2;
    $[0] = a;
  } else {
    a = $[0];
  }
}

```
      
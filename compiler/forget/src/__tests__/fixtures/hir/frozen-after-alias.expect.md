
## Input

```javascript
function Component() {
  const a = [];
  const b = a;
  useFreeze(a);
  foo(b); // should be readonly, value is guaranteed frozen via alias
  return b;
}

function useFreeze() {}
function foo(x) {}

```

## Code

```javascript
function Component() {
  const $ = React.unstable_useMemoCache();
  let a;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    a = [];
    $[0] = a;
  } else {
    a = $[0];
  }
  const b = a;
  useFreeze(a);
  foo(b);
  return b;
}

function useFreeze() {}
function foo(x) {}

```
      
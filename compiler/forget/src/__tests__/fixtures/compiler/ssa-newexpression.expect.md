
## Input

```javascript
function Foo() {}

function Component(props) {
  const a = [];
  const b = {};
  let c = new Foo(a, b);
  return c;
}

```

## Code

```javascript
function Foo() {
  return undefined;
}

function Component(props) {
  const $ = React.unstable_useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const a = [];
    const b = {};
    t0 = new Foo(a, b);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const c = t0;
  return c;
}

```
      
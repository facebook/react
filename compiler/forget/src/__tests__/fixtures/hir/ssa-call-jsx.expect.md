
## Input

```javascript
function foo() {}

function Component(props) {
  const a = [];
  const b = {};
  foo(a, b);
  let _ = <div a={a} />;
  foo(a, b);
  return <div a={a} b={b} />;
}

```

## Code

```javascript
function foo() {}

function Component(props) {
  const $ = React.unstable_useMemoCache(3);
  let a;
  let b;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    a = [];
    b = {};
    foo(a, b);

    foo(a, b);
    $[0] = a;
    $[1] = b;
  } else {
    a = $[0];
    b = $[1];
  }
  let t0;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <div a={a} b={b}></div>;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

```
      

## Input

```javascript
// @Pass runMutableRangeAnalysis
function foo() {}

function Component(props) {
  const a = [];
  const b = {};
  foo(a, b);
  if (foo()) {
    let _ = <div a={a} />;
  }
  foo(a, b);
  return <div a={a} b={b} />;
}

```

## Code

```javascript
// @Pass runMutableRangeAnalysis
function foo() {}

function Component(props) {
  const $ = React.unstable_useMemoCache(4);
  let a;
  let b;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    a = [];
    b = {};
    foo(a, b);
    let t0;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = foo();
      $[2] = t0;
    } else {
      t0 = $[2];
    }
    if (t0) {
    }

    foo(a, b);
    $[0] = a;
    $[1] = b;
  } else {
    a = $[0];
    b = $[1];
  }
  let t1;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = <div a={a} b={b}></div>;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

```
      
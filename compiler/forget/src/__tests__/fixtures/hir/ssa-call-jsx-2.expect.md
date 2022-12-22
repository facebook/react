
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
function foo() {}

```
## Code

```javascript
function Component(props) {
  const $ = React.useMemoCache();
  let a;
  let b;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    a = [];
    b = {};
    foo(a, b);
    let t2;

    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      t2 = foo();
      $[2] = t2;
    } else {
      t2 = $[2];
    }

    if (t2) {
      const _ = <div a={a}></div>;
    }

    foo(a, b);
    $[0] = a;
    $[1] = b;
  } else {
    a = $[0];
    b = $[1];
  }

  const c_3 = $[3] !== a;
  const c_4 = $[4] !== b;
  let t5;

  if (c_3 || c_4) {
    t5 = <div a={a} b={b}></div>;
    $[3] = a;
    $[4] = b;
    $[5] = t5;
  } else {
    t5 = $[5];
  }

  return t5;
}

```
      
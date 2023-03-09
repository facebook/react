
## Input

```javascript
function foo() {}

function Component(props) {
  const a = [];
  const b = {};
  foo(a, b);
  let _ = <div a={a} />;
  foo(b);
  return <div a={a} b={b} />;
}

```

## Code

```javascript
function foo() {}

function Component(props) {
  const $ = React.unstable_useMemoCache(2);
  let a;
  let b;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    a = [];
    b = {};
    foo(a, b);

    foo(b);
    $[0] = a;
    $[1] = b;
  } else {
    a = $[0];
    b = $[1];
  }
  return <div a={a} b={b}></div>;
}

```
      
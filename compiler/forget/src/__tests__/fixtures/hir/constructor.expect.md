
## Input

```javascript
function Foo() {}

function Component(props) {
  const a = [];
  const b = {};
  new Foo(a, b);
  let _ = <div a={a} />;
  new Foo(b);
  return <div a={a} b={b} />;
}

```

## Code

```javascript
function Foo() {}

function Component(props) {
  const $ = React.unstable_useMemoCache(2);
  let a;
  let b;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    a = [];
    b = {};
    new Foo(a, b);
    new Foo(b);
    $[0] = a;
    $[1] = b;
  } else {
    a = $[0];
    b = $[1];
  }
  return <div a={a} b={b}></div>;
}

```
      
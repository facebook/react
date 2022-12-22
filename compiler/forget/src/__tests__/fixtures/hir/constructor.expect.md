
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
    new Foo(a, b);

    const _ = <div a={a}></div>;

    new Foo(b);
    $[0] = a;
    $[1] = b;
  } else {
    a = $[0];
    b = $[1];
  }

  const c_2 = $[2] !== a;
  const c_3 = $[3] !== b;
  let t4;

  if (c_2 || c_3) {
    t4 = <div a={a} b={b}></div>;
    $[2] = a;
    $[3] = b;
    $[4] = t4;
  } else {
    t4 = $[4];
  }

  return t4;
}

```
      
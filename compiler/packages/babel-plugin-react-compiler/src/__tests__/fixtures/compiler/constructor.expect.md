
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
import { c as _c } from "react/compiler-runtime";
function Foo() {}

function Component(props) {
  const $ = _c(3);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = [];
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const a = t0;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = {};
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const b = t1;
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = <div a={a} b={b} />;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  new Foo(a, b);
  new Foo(b);
  return t2;
}

```
      
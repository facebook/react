
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
import { unstable_useMemoCache as useMemoCache } from "react";
function Foo() {}

function Component(props) {
  const $ = useMemoCache(3);
  let a;
  let b;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    a = [];
    b = {};
    new Foo(a, b);
    new Foo(b);
    t0 = <div a={a} b={b} />;
    $[0] = a;
    $[1] = b;
    $[2] = t0;
  } else {
    a = $[0];
    b = $[1];
    t0 = $[2];
  }
  return t0;
}

```
      
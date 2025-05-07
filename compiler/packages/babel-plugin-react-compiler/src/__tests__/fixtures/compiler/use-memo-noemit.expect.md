
## Input

```javascript
// @noEmit

function Foo() {
  'use memo';
  return <button onClick={() => alert('hello!')}>Click me!</button>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @noEmit

function Foo() {
  "use memo";
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <button onClick={_temp}>Click me!</button>;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}
function _temp() {
  return alert("hello!");
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [],
};

```
      
### Eval output
(kind: ok) <button>Click me!</button>
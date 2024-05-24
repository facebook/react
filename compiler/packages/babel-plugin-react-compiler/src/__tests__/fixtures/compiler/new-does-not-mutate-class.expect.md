
## Input

```javascript
import { identity } from "shared-runtime";

class Foo {}
function Component({ val }) {
  const MyClass = identity(Foo);
  const x = [val];
  const y = new MyClass();

  return [x, y];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ val: 0 }],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { identity } from "shared-runtime";

class Foo {}
function Component(t0) {
  const $ = _c(5);
  const { val } = t0;
  let t1;
  if ($[0] !== val) {
    t1 = [val];
    $[0] = val;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const x = t1;
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    const MyClass = identity(Foo);
    t2 = new MyClass();
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  const y = t2;
  let t3;
  if ($[3] !== x) {
    t3 = [x, y];
    $[3] = x;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ val: 0 }],
};

```
      
### Eval output
(kind: ok) [[0],{}]
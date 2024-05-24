
## Input

```javascript
function Component(props) {
  // a does not need to be memoized ever, even though it's a
  // dependency of c, which exists in a scope that has a memoized
  // output. it doesn't need to be memoized bc the value is a primitive type.
  const a = props.a + props.b;

  // b and c are interleaved and grouped into a single scope,
  // but they are independent values. c does not escape, but
  // we need to ensure that a is memoized or else b will invalidate
  // on every render since a is a dependency.
  const b = [];
  const c = {};
  c.a = a;
  b.push(props.c);

  return b;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(3);
  let t0;
  let t1;
  if ($[0] !== props) {
    const b = [];

    t1 = b;
    t0 = props;
    b.push(props.c);
    $[0] = props;
    $[1] = t0;
    $[2] = t1;
  } else {
    t0 = $[1];
    t1 = $[2];
  }
  const c = {};
  const a = t0.a + props.b;
  c.a = a;
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      
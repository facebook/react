
## Input

```javascript
import { addOne, shallowCopy } from "shared-runtime";

function foo(a, b, c) {
  // Construct and freeze x
  const x = shallowCopy(a);
  <div>{x}</div>;

  // y should depend on `x` and `b`
  const y = x.foo(b);
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [{ foo: addOne }, 3],
  isComponent: false,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { addOne, shallowCopy } from "shared-runtime";

function foo(a, b, c) {
  const $ = _c(3);
  let t0;
  if ($[0] !== a || $[1] !== b) {
    const x = shallowCopy(a);

    t0 = x.foo(b);
    $[0] = a;
    $[1] = b;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  const y = t0;
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [{ foo: addOne }, 3],
  isComponent: false,
};

```
      
### Eval output
(kind: ok) 4

## Input

```javascript
// bar(props.b) is an allocating expression that produces a primitive, which means
// that Forget should memoize it.
// Correctness:

import { identity, mutate, setProperty } from "shared-runtime";

//   - y depends on either bar(props.b) or bar(props.b) + 1
function AllocatingPrimitiveAsDepNested(props) {
  let x = {};
  mutate(x);
  let y = identity(identity(props.b) + 1);
  setProperty(x, props.a);
  return [x, y];
}

export const FIXTURE_ENTRYPOINT = {
  fn: AllocatingPrimitiveAsDepNested,
  params: [{ a: 1, b: 2 }],
  sequentialRenders: [
    // change b
    { a: 1, b: 3 },
    // change b
    { a: 1, b: 4 },
    // change a
    { a: 2, b: 4 },
    // change a
    { a: 3, b: 4 },
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // bar(props.b) is an allocating expression that produces a primitive, which means
// that Forget should memoize it.
// Correctness:

import { identity, mutate, setProperty } from "shared-runtime";

//   - y depends on either bar(props.b) or bar(props.b) + 1
function AllocatingPrimitiveAsDepNested(props) {
  const $ = _c(3);
  let t0;
  if ($[0] !== props.b || $[1] !== props.a) {
    const x = {};
    mutate(x);
    const y = identity(identity(props.b) + 1);

    t0 = [x, y];
    setProperty(x, props.a);
    $[0] = props.b;
    $[1] = props.a;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: AllocatingPrimitiveAsDepNested,
  params: [{ a: 1, b: 2 }],
  sequentialRenders: [
    // change b
    { a: 1, b: 3 },
    // change b
    { a: 1, b: 4 },
    // change a
    { a: 2, b: 4 },
    // change a
    { a: 3, b: 4 },
  ],
};

```
      
### Eval output
(kind: ok) [{"wat0":"joe","wat1":1},4]
[{"wat0":"joe","wat1":1},5]
[{"wat0":"joe","wat1":2},5]
[{"wat0":"joe","wat1":3},5]
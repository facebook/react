
## Input

```javascript
// Test that we can track non-overlapping dependencies separately.
// (not needed for correctness but for dependency granularity)
function TestNonOverlappingDescendantTracked(props) {
  let x = {};
  x.a = props.a.x.y;
  x.b = props.b;
  x.c = props.a.c.x.y.z;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: TestNonOverlappingDescendantTracked,
  params: [{ a: { x: {}, c: { x: { y: { z: 3 } } } } }],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // Test that we can track non-overlapping dependencies separately.
// (not needed for correctness but for dependency granularity)
function TestNonOverlappingDescendantTracked(props) {
  const $ = _c(4);
  let t0;
  if ($[0] !== props.a.x.y || $[1] !== props.a.c.x.y.z || $[2] !== props.b) {
    const x = {};

    t0 = x;
    x.a = props.a.x.y;
    x.b = props.b;
    x.c = props.a.c.x.y.z;
    $[0] = props.a.x.y;
    $[1] = props.a.c.x.y.z;
    $[2] = props.b;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: TestNonOverlappingDescendantTracked,
  params: [{ a: { x: {}, c: { x: { y: { z: 3 } } } } }],
};

```
      
### Eval output
(kind: ok) {"c":3}
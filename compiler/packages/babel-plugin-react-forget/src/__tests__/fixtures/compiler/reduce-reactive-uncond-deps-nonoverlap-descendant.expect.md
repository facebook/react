
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
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // Test that we can track non-overlapping dependencies separately.
// (not needed for correctness but for dependency granularity)
function TestNonOverlappingDescendantTracked(props) {
  const $ = useMemoCache(4);
  let x;
  if ($[0] !== props.a.x.y || $[1] !== props.a.c.x.y.z || $[2] !== props.b) {
    x = {};
    x.a = props.a.x.y;
    x.b = props.b;
    x.c = props.a.c.x.y.z;
    $[0] = props.a.x.y;
    $[1] = props.a.c.x.y.z;
    $[2] = props.b;
    $[3] = x;
  } else {
    x = $[3];
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: TestNonOverlappingDescendantTracked,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      
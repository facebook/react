
## Input

```javascript
// Test that we can track non-overlapping dependencies separately.
// (not needed for correctness but for dependency granularity)
function TestNonOverlappingTracked(props) {
  let x = {};
  x.b = props.a.b;
  x.c = props.a.c;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: TestNonOverlappingTracked,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // Test that we can track non-overlapping dependencies separately.
// (not needed for correctness but for dependency granularity)
function TestNonOverlappingTracked(props) {
  const $ = useMemoCache(3);
  let x;
  if ($[0] !== props.a.b || $[1] !== props.a.c) {
    x = {};
    x.b = props.a.b;
    x.c = props.a.c;
    $[0] = props.a.b;
    $[1] = props.a.c;
    $[2] = x;
  } else {
    x = $[2];
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: TestNonOverlappingTracked,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      
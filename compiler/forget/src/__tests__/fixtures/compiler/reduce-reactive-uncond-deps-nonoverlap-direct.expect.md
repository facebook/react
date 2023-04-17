
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

```

## Code

```javascript
import * as React from "react"; // Test that we can track non-overlapping dependencies separately.
// (not needed for correctness but for dependency granularity)
function TestNonOverlappingTracked(props) {
  const $ = React.unstable_useMemoCache(3);
  const c_0 = $[0] !== props.a.b;
  const c_1 = $[1] !== props.a.c;
  let x;
  if (c_0 || c_1) {
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

```
      
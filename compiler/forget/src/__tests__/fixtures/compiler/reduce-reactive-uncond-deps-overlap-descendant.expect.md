
## Input

```javascript
// Test that we correctly track a subpath if the subpath itself is accessed as
// a dependency
function TestOverlappingDescendantTracked(props) {
  let x = {};
  x.b = props.a.b.c;
  x.c = props.a.b.c.x.y;
  x.a = props.a;
  return x;
}

```

## Code

```javascript
import * as React from "react"; // Test that we correctly track a subpath if the subpath itself is accessed as
// a dependency
function TestOverlappingDescendantTracked(props) {
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== props.a;
  let x;
  if (c_0) {
    x = {};
    x.b = props.a.b.c;
    x.c = props.a.b.c.x.y;
    x.a = props.a;
    $[0] = props.a;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      

## Input

```javascript
// Determine that we only need to track p.a here
// Ordering of access should not matter
function TestDepsSubpathOrder3(props) {
  let x = {};
  x.c = props.a.b.c;
  x.a = props.a;
  x.b = props.a.b;
  return x;
}

```

## Code

```javascript
import * as React from "react"; // Determine that we only need to track p.a here
// Ordering of access should not matter
function TestDepsSubpathOrder3(props) {
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== props.a;
  let x;
  if (c_0) {
    x = {};
    x.c = props.a.b.c;
    x.a = props.a;
    x.b = props.a.b;
    $[0] = props.a;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      
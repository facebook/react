
## Input

```javascript
// Determine that we only need to track p.a here
// Ordering of access should not matter
function TestDepsSubpathOrder1(props) {
  let x = {};
  x.b = props.a.b;
  x.a = props.a;
  x.c = props.a.b.c;
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // Determine that we only need to track p.a here
// Ordering of access should not matter
function TestDepsSubpathOrder1(props) {
  const $ = useMemoCache(2);
  const c_0 = $[0] !== props.a;
  let x;
  if (c_0) {
    x = {};
    x.b = props.a.b;
    x.a = props.a;
    x.c = props.a.b.c;
    $[0] = props.a;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      

## Input

```javascript
// When a conditional dependency `props.a.b.c` has no unconditional dependency
// in its subpath or superpath, we should find the nearest unconditional access
// and promote it to an unconditional dependency.
function TestPromoteUnconditionalAccessToDependency(props, other) {
  const x = {};
  x.a = props.a.a.a;
  if (foo(other)) {
    x.c = props.a.b.c;
  }
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // When a conditional dependency `props.a.b.c` has no unconditional dependency
// in its subpath or superpath, we should find the nearest unconditional access
// and promote it to an unconditional dependency.
function TestPromoteUnconditionalAccessToDependency(props, other) {
  const $ = useMemoCache(3);
  let x;
  if ($[0] !== props.a || $[1] !== other) {
    x = {};
    x.a = props.a.a.a;
    if (foo(other)) {
      x.c = props.a.b.c;
    }
    $[0] = props.a;
    $[1] = other;
    $[2] = x;
  } else {
    x = $[2];
  }
  return x;
}

```
      
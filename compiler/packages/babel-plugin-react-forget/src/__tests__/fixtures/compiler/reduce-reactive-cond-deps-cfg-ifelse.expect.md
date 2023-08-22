
## Input

```javascript
// props.a.b should be added as a unconditional dependency to the reactive
// scope that produces x, since it is accessed unconditionally in all cfg
// paths

function TestCondDepInDirectIfElse(props, other) {
  const x = {};
  if (foo(other)) {
    x.b = props.a.b;
  } else {
    x.c = props.a.b;
  }
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // props.a.b should be added as a unconditional dependency to the reactive
// scope that produces x, since it is accessed unconditionally in all cfg
// paths

function TestCondDepInDirectIfElse(props, other) {
  const $ = useMemoCache(3);
  const c_0 = $[0] !== other;
  const c_1 = $[1] !== props.a.b;
  let x;
  if (c_0 || c_1) {
    x = {};
    if (foo(other)) {
      x.b = props.a.b;
    } else {
      x.c = props.a.b;
    }
    $[0] = other;
    $[1] = props.a.b;
    $[2] = x;
  } else {
    x = $[2];
  }
  return x;
}

```
      
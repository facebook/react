
## Input

```javascript
function foo(props) {
  let x = [];
  x.push(props.bar);
  if (props.cond) {
    x = {};
    x = [];
    x.push(props.foo);
  }
  return x;
}

```

## Code

```javascript
import * as React from "react";
function foo(props) {
  const $ = React.unstable_useMemoCache(4);
  const c_0 = $[0] !== props.bar;
  let x;
  if (c_0) {
    x = [];
    x.push(props.bar);
    $[0] = props.bar;
    $[1] = x;
  } else {
    x = $[1];
  }
  if (props.cond) {
    const c_2 = $[2] !== props.foo;
    if (c_2) {
      x = [];
      x.push(props.foo);
      $[2] = props.foo;
      $[3] = x;
    } else {
      x = $[3];
    }
  }
  return x;
}

```
      

## Input

```javascript
function Component(props) {
  const index = "foo";
  const x = {};
  x[index] = x[index] + x["bar"];
  x[index](props.foo);
  return x;
}

```

## Code

```javascript
import * as React from "react";
function Component(props) {
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== props.foo;
  let x;
  if (c_0) {
    x = {};
    x.foo = x.foo + x.bar;
    x.foo(props.foo);
    $[0] = props.foo;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      
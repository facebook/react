
## Input

```javascript
function Component(props) {
  const x = { ["foo"]: props.foo };
  return x;
}

```

## Code

```javascript
import * as React from "react";
function Component(props) {
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== props.foo;
  let t0;
  if (c_0) {
    t0 = { foo: props.foo };
    $[0] = props.foo;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const x = t0;
  return x;
}

```
      
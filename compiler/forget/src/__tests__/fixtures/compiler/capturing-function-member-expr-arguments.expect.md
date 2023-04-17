
## Input

```javascript
function Foo(props) {
  const onFoo = useCallback(
    (reason) => {
      log(props.router.location);
    },
    [props.router.location]
  );

  return onFoo;
}

```

## Code

```javascript
import * as React from "react";
function Foo(props) {
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== props.router.location;
  let t0;
  if (c_0) {
    t0 = (reason) => {
      log(props.router.location);
    };
    $[0] = props.router.location;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const onFoo = t0;
  return onFoo;
}

```
      
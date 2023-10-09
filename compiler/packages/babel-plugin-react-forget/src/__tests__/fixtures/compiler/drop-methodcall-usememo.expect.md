
## Input

```javascript
import * as React from "react";

function Component(props) {
  const x = React.useMemo(() => {
    const x = [];
    x.push(props.value);
    return x;
  }, [props.value]);
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 42 }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import * as React from "react";

function Component(props) {
  const $ = useMemoCache(2);
  let t42;
  const c_0 = $[0] !== props.value;
  let x;
  if (c_0) {
    x = [];
    x.push(props.value);
    $[0] = props.value;
    $[1] = x;
  } else {
    x = $[1];
  }
  t42 = x;
  const x_0 = t42;
  return x_0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 42 }],
};

```
      
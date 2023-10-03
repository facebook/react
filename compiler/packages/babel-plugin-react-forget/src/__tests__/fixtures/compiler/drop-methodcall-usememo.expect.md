
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
  const c_0 = $[0] !== props.value;
  let t0;
  if (c_0) {
    t0 = (() => {
      const x = [];
      x.push(props.value);
      return x;
    })();
    $[0] = props.value;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const x_0 = t0;
  return x_0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 42 }],
};

```
      
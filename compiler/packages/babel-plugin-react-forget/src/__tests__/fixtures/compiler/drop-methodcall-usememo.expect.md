
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
  let t19;
  let x;
  if ($[0] !== props.value) {
    x = [];
    x.push(props.value);
    $[0] = props.value;
    $[1] = x;
  } else {
    x = $[1];
  }
  t19 = x;
  const x_0 = t19;
  return x_0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 42 }],
};

```
      
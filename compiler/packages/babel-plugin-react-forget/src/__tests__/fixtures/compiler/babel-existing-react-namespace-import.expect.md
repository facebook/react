
## Input

```javascript
import * as React from "react";
import { calculateExpensiveNumber } from "shared-runtime";

function Component(props) {
  const [x] = React.useState(0);
  const expensiveNumber = React.useMemo(() => calculateExpensiveNumber(x), [x]);

  return <div>{expensiveNumber}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import * as React from "react";
import { calculateExpensiveNumber } from "shared-runtime";

function Component(props) {
  const $ = useMemoCache(2);
  const [x] = React.useState(0);
  let t39;
  t39 = calculateExpensiveNumber(x);
  const expensiveNumber = t39;
  const c_0 = $[0] !== expensiveNumber;
  let t0;
  if (c_0) {
    t0 = <div>{expensiveNumber}</div>;
    $[0] = expensiveNumber;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```
      
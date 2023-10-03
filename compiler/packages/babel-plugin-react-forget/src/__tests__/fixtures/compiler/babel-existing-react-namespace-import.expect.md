
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
  const $ = useMemoCache(5);
  const [x] = React.useState(0);
  const c_0 = $[0] !== x;
  let t0;
  let t1;
  if (c_0) {
    t0 = () => calculateExpensiveNumber(x);
    t1 = [x];
    $[0] = x;
    $[1] = t0;
    $[2] = t1;
  } else {
    t0 = $[1];
    t1 = $[2];
  }
  const expensiveNumber = React.useMemo(t0, t1);
  const c_3 = $[3] !== expensiveNumber;
  let t2;
  if (c_3) {
    t2 = <div>{expensiveNumber}</div>;
    $[3] = expensiveNumber;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```
      
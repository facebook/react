
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
  const $ = useMemoCache(4);
  const [x] = React.useState(0);
  let t17;
  let t0;
  if ($[0] !== x) {
    t0 = calculateExpensiveNumber(x);
    $[0] = x;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  t17 = t0;
  const expensiveNumber = t17;
  let t1;
  if ($[2] !== expensiveNumber) {
    t1 = <div>{expensiveNumber}</div>;
    $[2] = expensiveNumber;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```
      
### Eval output
(kind: ok) <div>0</div>
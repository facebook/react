
## Input

```javascript
import * as React from "react";
import { useMemo } from "react";

function Component(props) {
  const [x] = React.useState(0);
  const expensiveNumber = useMemo(() => calculateExpensiveNumber(x), [x]);

  return <div>{expensiveNumber}</div>;
}

function Component2(props) {
  const [x] = React.useState(0);
  const expensiveNumber = useMemo(() => calculateExpensiveNumber(x), [x]);

  return <div>{expensiveNumber}</div>;
}

```

## Code

```javascript
import * as React from "react";
import { useMemo } from "react";

function Component(props) {
  const $ = React.unstable_useMemoCache(2);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const [x] = React.useState(0);
    t0 = calculateExpensiveNumber(x);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const t17 = t0;
  const expensiveNumber = t17;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = <div>{expensiveNumber}</div>;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

function Component2(props) {
  const $ = React.unstable_useMemoCache(2);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const [x] = React.useState(0);
    t0 = calculateExpensiveNumber(x);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const t17 = t0;
  const expensiveNumber = t17;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = <div>{expensiveNumber}</div>;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

```
      
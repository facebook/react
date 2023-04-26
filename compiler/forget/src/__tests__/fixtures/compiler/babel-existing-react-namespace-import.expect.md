
## Input

```javascript
import * as React from "react";

function Component(props) {
  const [x] = React.useState(0);
  const expensiveNumber = React.useMemo(() => calculateExpensiveNumber(x), [x]);

  return <div>{expensiveNumber}</div>;
}

function Component2(props) {
  const [x] = React.useState(0);
  const expensiveNumber = React.useMemo(() => calculateExpensiveNumber(x), [x]);

  return <div>{expensiveNumber}</div>;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import * as React from "react";

function Component(props) {
  const $ = useMemoCache(2);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const [x] = React.useState(0);
    t0 = React.useMemo(() => calculateExpensiveNumber(x), [x]);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const expensiveNumber = t0;
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
  const $ = useMemoCache(2);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const [x] = React.useState(0);
    t0 = React.useMemo(() => calculateExpensiveNumber(x), [x]);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const expensiveNumber = t0;
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
      
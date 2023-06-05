
## Input

```javascript
import * as React from "react";
import { useState } from "react";

function Component(props) {
  const [x] = useState(0);
  const expensiveNumber = React.useMemo(() => calculateExpensiveNumber(x), [x]);

  return <div>{expensiveNumber}</div>;
}

function Component2(props) {
  const [x] = useState(0);
  const expensiveNumber = React.useMemo(() => calculateExpensiveNumber(x), [x]);

  return <div>{expensiveNumber}</div>;
}

```

## Code

```javascript
import * as React from "react";
import { useState, unstable_useMemoCache as useMemoCache } from "react";

function Component(props) {
  const $ = useMemoCache(6);
  const [x] = useState(0);
  const c_0 = $[0] !== x;
  let t1;
  if (c_0) {
    const c_2 = $[2] !== x;
    let t0;
    if (c_2) {
      t0 = () => calculateExpensiveNumber(x);
      $[2] = x;
      $[3] = t0;
    } else {
      t0 = $[3];
    }
    t1 = React.useMemo(t0, [x]);
    $[0] = x;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const expensiveNumber = t1;
  const c_4 = $[4] !== expensiveNumber;
  let t2;
  if (c_4) {
    t2 = <div>{expensiveNumber}</div>;
    $[4] = expensiveNumber;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  return t2;
}

function Component2(props) {
  const $ = useMemoCache(6);
  const [x] = useState(0);
  const c_0 = $[0] !== x;
  let t1;
  if (c_0) {
    const c_2 = $[2] !== x;
    let t0;
    if (c_2) {
      t0 = () => calculateExpensiveNumber(x);
      $[2] = x;
      $[3] = t0;
    } else {
      t0 = $[3];
    }
    t1 = React.useMemo(t0, [x]);
    $[0] = x;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const expensiveNumber = t1;
  const c_4 = $[4] !== expensiveNumber;
  let t2;
  if (c_4) {
    t2 = <div>{expensiveNumber}</div>;
    $[4] = expensiveNumber;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  return t2;
}

```
      
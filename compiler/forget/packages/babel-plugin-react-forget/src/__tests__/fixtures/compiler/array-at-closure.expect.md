
## Input

```javascript
function Component(props) {
  const x = foo(props.x);
  const fn = function () {
    const arr = [...bar(props)];
    return arr.at(x);
  };
  const fnResult = fn();
  return fnResult;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(7);
  const t0 = props.x;
  const c_0 = $[0] !== t0;
  let t1;
  if (c_0) {
    t1 = foo(t0);
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const x = t1;
  const c_2 = $[2] !== props;
  const c_3 = $[3] !== x;
  let t2;
  if (c_2 || c_3) {
    t2 = function () {
      const arr = [...bar(props)];
      return arr.at(x);
    };
    $[2] = props;
    $[3] = x;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  const fn = t2;
  const c_5 = $[5] !== fn;
  let t3;
  if (c_5) {
    t3 = fn();
    $[5] = fn;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  const fnResult = t3;
  return fnResult;
}

```
      
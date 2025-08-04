
## Input

```javascript
const YearsAndMonthsSince = () => {
  const diff = foo();
  const months = Math.floor(diff.bar());
  return <>{months}</>;
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
const YearsAndMonthsSince = () => {
  const $ = _c(4);
  let t0;
  let t1;
  let t2;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const diff = foo();
    t0 = Math;
    t1 = t0.floor;
    t2 = diff.bar();
    $[0] = t0;
    $[1] = t1;
    $[2] = t2;
  } else {
    t0 = $[0];
    t1 = $[1];
    t2 = $[2];
  }
  const months = t1(t2);
  let t3;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = <>{months}</>;
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  return t3;
};

```
      
### Eval output
(kind: exception) Fixture not implemented
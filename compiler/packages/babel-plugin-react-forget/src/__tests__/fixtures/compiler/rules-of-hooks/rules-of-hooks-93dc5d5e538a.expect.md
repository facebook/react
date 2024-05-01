
## Input

```javascript
// Valid because the loop doesn't change the order of hooks calls.
function RegressionTest() {
  const res = [];
  const additionalCond = true;
  for (let i = 0; i !== 10 && additionalCond; ++i) {
    res.push(i);
  }
  React.useLayoutEffect(() => {});
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // Valid because the loop doesn't change the order of hooks calls.
function RegressionTest() {
  const $ = useMemoCache(1);
  const res = [];
  for (let i = 0; i !== 10 && true; ++i) {
    res.push(i);
  }
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {};
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  React.useLayoutEffect(t0);
}

```
      

## Input

```javascript
function Component(props) {
  const maybeMutable = new MaybeMutable();
  return <div>{maybeMutate(maybeMutable)}</div>;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(3);
  let T0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const maybeMutable = new MaybeMutable();
    T0 = "div";
    t1 = maybeMutate(maybeMutable);
    $[0] = T0;
    $[1] = t1;
  } else {
    T0 = $[0];
    t1 = $[1];
  }
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = <T0>{t1}</T0>;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  return t2;
}

```
      
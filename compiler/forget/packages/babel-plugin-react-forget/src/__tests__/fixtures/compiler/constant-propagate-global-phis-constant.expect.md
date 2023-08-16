
## Input

```javascript
function Test() {
  const { tab } = useFoo();
  const currentTab = tab === WAT ? WAT : WAT;

  return <Foo value={currentTab} />;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Test() {
  const $ = useMemoCache(1);
  const { tab } = useFoo();
  tab === WAT ? WAT : WAT;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <Foo value={WAT} />;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

```
      
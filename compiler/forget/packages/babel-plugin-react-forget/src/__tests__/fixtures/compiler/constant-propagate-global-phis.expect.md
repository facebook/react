
## Input

```javascript
function Test() {
  const { tab } = useFoo();
  const currentTab = tab === WAT ? WAT : BAR;

  return <Foo value={currentTab} />;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Test() {
  const $ = useMemoCache(2);
  const { tab } = useFoo();
  const currentTab = tab === WAT ? WAT : BAR;
  const c_0 = $[0] !== currentTab;
  let t0;
  if (c_0) {
    t0 = <Foo value={currentTab} />;
    $[0] = currentTab;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      
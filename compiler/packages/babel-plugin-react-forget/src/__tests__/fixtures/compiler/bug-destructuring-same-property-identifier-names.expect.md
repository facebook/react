
## Input

```javascript
function Component(props) {
  const {
    x: { destructured },
    sameName: renamed,
  } = props;
  const sameName = foo(destructured);

  return [sameName, renamed];
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(6);
  let sameName;
  let renamed;
  if ($[0] !== props) {
    const { x: t20, sameName: t32 } = props;
    renamed = t32;
    sameName = foo(destructured);
    $[0] = props;
    $[1] = sameName;
    $[2] = renamed;
  } else {
    sameName = $[1];
    renamed = $[2];
  }

  const t0 = sameName;
  let t1;
  if ($[3] !== t0 || $[4] !== renamed) {
    t1 = [t0, renamed];
    $[3] = t0;
    $[4] = renamed;
    $[5] = t1;
  } else {
    t1 = $[5];
  }
  return t1;
}

```
      
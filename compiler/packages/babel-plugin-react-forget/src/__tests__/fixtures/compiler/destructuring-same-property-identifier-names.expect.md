
## Input

```javascript
import { identity } from "shared-runtime";

function Component(props) {
  const {
    x: { destructured },
    sameName: renamed,
  } = props;
  const sameName = identity(destructured);

  return [sameName, renamed];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ x: { destructured: 0 }, sameName: 2 }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import { identity } from "shared-runtime";

function Component(props) {
  const $ = useMemoCache(5);
  const { x: t18, sameName: renamed } = props;
  const { destructured } = t18;
  let t0;
  if ($[0] !== destructured) {
    t0 = identity(destructured);
    $[0] = destructured;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const sameName = t0;
  let t1;
  if ($[2] !== sameName || $[3] !== renamed) {
    t1 = [sameName, renamed];
    $[2] = sameName;
    $[3] = renamed;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ x: { destructured: 0 }, sameName: 2 }],
};

```
      
### Eval output
(kind: ok) [0,2]
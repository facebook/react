
## Input

```javascript
import { invoke } from "shared-runtime";

function Component({ shouldReassign }) {
  let x = null;
  const reassign = () => {
    if (shouldReassign) {
      x = 2;
    }
  };
  invoke(reassign);
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ shouldReassign: true }],
  sequentialRenders: [{ shouldReassign: false }, { shouldReassign: true }],
};

```

## Code

```javascript
import { c as useMemoCache } from "react";
import { invoke } from "shared-runtime";

function Component(t0) {
  const $ = useMemoCache(2);
  const { shouldReassign } = t0;
  let x;
  if ($[0] !== shouldReassign) {
    x = null;
    const reassign = () => {
      if (shouldReassign) {
        x = 2;
      }
    };

    invoke(reassign);
    $[0] = shouldReassign;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ shouldReassign: true }],
  sequentialRenders: [{ shouldReassign: false }, { shouldReassign: true }],
};

```
      
### Eval output
(kind: ok) null
2
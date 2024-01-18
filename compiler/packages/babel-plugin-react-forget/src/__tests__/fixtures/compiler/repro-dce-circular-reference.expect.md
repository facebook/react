
## Input

```javascript
import { identity } from "shared-runtime";

function Component({ data }) {
  let x = 0;
  for (const item of data) {
    const { current, other } = item;
    x += current;
    identity(other);
  }
  return [x];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [
    {
      data: [
        { current: 2, other: 3 },
        { current: 4, other: 5 },
      ],
    },
  ],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import { identity } from "shared-runtime";

function Component(t25) {
  const $ = useMemoCache(2);
  const { data } = t25;
  let x = 0;
  for (const item of data) {
    const { current, other } = item;
    x = x + current;
    identity(other);
  }
  let t0;
  if ($[0] !== x) {
    t0 = [x];
    $[0] = x;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [
    {
      data: [
        { current: 2, other: 3 },
        { current: 4, other: 5 },
      ],
    },
  ],
};

```
      
### Eval output
(kind: ok) [6]
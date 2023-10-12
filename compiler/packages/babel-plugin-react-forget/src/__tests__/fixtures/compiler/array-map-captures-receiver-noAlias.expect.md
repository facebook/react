
## Input

```javascript
function Component(props) {
  // This item is part of the receiver, should be memoized
  const item = { a: props.a };
  const items = [item];
  const mapped = items.map((item) => item);
  return mapped;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: { id: 42 } }],
  isComponent: false,
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(2);
  let t0;
  if ($[0] !== props.a) {
    const item = { a: props.a };
    const items = [item];
    t0 = items.map((item_0) => item_0);
    $[0] = props.a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const mapped = t0;
  return mapped;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: { id: 42 } }],
  isComponent: false,
};

```
      
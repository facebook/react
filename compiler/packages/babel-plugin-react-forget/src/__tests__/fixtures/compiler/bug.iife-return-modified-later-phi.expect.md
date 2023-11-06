
## Input

```javascript
function Component(props) {
  const items = (() => {
    if (props.cond) {
      return [];
    } else {
      return null;
    }
  })();
  items.push(props.a);
  return items;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: {} }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(1);
  let t27;
  if (props.cond) {
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      t27 = [];
      $[0] = t27;
    } else {
      t27 = $[0];
    }
  } else {
    t27 = null;
  }
  const items = t27;

  items.push(props.a);
  return items;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: {} }],
};

```
      
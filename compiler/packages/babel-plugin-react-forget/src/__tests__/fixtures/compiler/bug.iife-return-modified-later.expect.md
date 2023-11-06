
## Input

```javascript
function Component(props) {
  const items = (() => {
    return [];
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
  let t17;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t17 = [];
    $[0] = t17;
  } else {
    t17 = $[0];
  }
  const items = t17;

  items.push(props.a);
  return items;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: {} }],
};

```
      

## Input

```javascript
function Component(props) {
  const item = useFragment(graphql`...`, props.item);
  return item.items?.map((item) => renderItem(item)) ?? [];
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(3);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = graphql`...`;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const item = useFragment(t0, props.item);
  const c_1 = $[1] !== item.items;
  let t1;
  if (c_1) {
    t1 = item.items?.map((item_0) => renderItem(item_0)) ?? [];
    $[1] = item.items;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

```
      

## Input

```javascript
function HomeDiscoStoreItemTileRating(props) {
  const item = useFragment();
  let count = 0;
  const aggregates = item?.aggregates || [];
  aggregates.forEach((aggregate) => {
    count += aggregate.count || 0;
  });

  return <Text>{count}</Text>;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function HomeDiscoStoreItemTileRating(props) {
  const $ = useMemoCache(3);
  const item = useFragment();
  let count;
  if ($[0] !== item) {
    count = 0;
    const aggregates = item?.aggregates || [];
    aggregates.forEach((aggregate) => {
      count = count + (aggregate.count || 0);
    });
    $[0] = item;
    $[1] = count;
  } else {
    count = $[1];
  }
  let t0;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <Text>{count}</Text>;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

```
      
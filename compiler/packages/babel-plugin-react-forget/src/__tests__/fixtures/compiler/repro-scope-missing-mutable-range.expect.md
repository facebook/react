
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
  const $ = useMemoCache(1);
  const item = useFragment();
  let count;
  count = 0;
  const aggregates = item?.aggregates || [];
  aggregates.forEach((aggregate) => {
    count = count + (aggregate.count || 0);
  });
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <Text>{count}</Text>;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

```
      
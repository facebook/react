
## Input

```javascript
function HomeDiscoStoreItemTileRating(props) {
  const item = useFragment();
  let count = 0;
  const aggregates = item?.aggregates || [];
  aggregates.forEach(aggregate => {
    count += aggregate.count || 0;
  });

  return <Text>{count}</Text>;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function HomeDiscoStoreItemTileRating(props) {
  const $ = _c(4);
  const item = useFragment();
  let count;
  if ($[0] !== item) {
    count = 0;
    const aggregates = item?.aggregates || [];
    aggregates.forEach((aggregate) => {
      count = count + (aggregate.count || 0);
      count;
    });
    $[0] = item;
    $[1] = count;
  } else {
    count = $[1];
  }

  const t0 = count;
  let t1;
  if ($[2] !== t0) {
    t1 = <Text>{t0}</Text>;
    $[2] = t0;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

```
      
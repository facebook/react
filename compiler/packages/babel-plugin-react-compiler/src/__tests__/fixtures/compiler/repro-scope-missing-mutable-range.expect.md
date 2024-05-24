
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
import { c as _c } from "react/compiler-runtime";
function HomeDiscoStoreItemTileRating(props) {
  const $ = _c(6);
  const t0 = useFragment();
  let count;
  let T0;
  if ($[0] !== t0) {
    count = 0;
    const item = t0;

    T0 = Text;
    const aggregates = item?.aggregates || [];
    aggregates.forEach((aggregate) => {
      count = count + (aggregate.count || 0);
      count;
    });
    $[0] = t0;
    $[1] = count;
    $[2] = T0;
  } else {
    count = $[1];
    T0 = $[2];
  }
  const t1 = count;
  let t2;
  if ($[3] !== T0 || $[4] !== t1) {
    t2 = <T0>{t1}</T0>;
    $[3] = T0;
    $[4] = t1;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  return t2;
}

```
      
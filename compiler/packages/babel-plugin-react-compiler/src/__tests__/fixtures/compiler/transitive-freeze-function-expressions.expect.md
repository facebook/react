
## Input

```javascript
// @enableTransitivelyFreezeFunctionExpressions
function Component(props) {
  const { data, loadNext, isLoadingNext } =
    usePaginationFragment(props.key).items ?? [];

  const loadMoreWithTiming = () => {
    if (data.length === 0) {
      return;
    }
    loadNext();
  };

  useEffect(() => {
    if (isLoadingNext) {
      return;
    }
    loadMoreWithTiming();
  }, [isLoadingNext, loadMoreWithTiming]);

  const items = data.map((x) => x);

  return items;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableTransitivelyFreezeFunctionExpressions
function Component(props) {
  const $ = _c(10);
  const { data, loadNext, isLoadingNext } =
    usePaginationFragment(props.key).items ?? [];
  let t0;
  if ($[0] !== data) {
    let t1;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      t1 = (x) => x;
      $[2] = t1;
    } else {
      t1 = $[2];
    }
    t0 = data.map(t1);
    $[0] = data;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const items = t0;
  let t1;
  if ($[3] !== data.length || $[4] !== loadNext) {
    t1 = () => {
      if (data.length === 0) {
        return;
      }
      loadNext();
    };
    $[3] = data.length;
    $[4] = loadNext;
    $[5] = t1;
  } else {
    t1 = $[5];
  }
  const loadMoreWithTiming = t1;
  let t2;
  let t3;
  if ($[6] !== isLoadingNext || $[7] !== loadMoreWithTiming) {
    t2 = () => {
      if (isLoadingNext) {
        return;
      }
      loadMoreWithTiming();
    };
    t3 = [isLoadingNext, loadMoreWithTiming];
    $[6] = isLoadingNext;
    $[7] = loadMoreWithTiming;
    $[8] = t2;
    $[9] = t3;
  } else {
    t2 = $[8];
    t3 = $[9];
  }
  useEffect(t2, t3);
  return items;
}

```
      

## Input

```javascript
// @enableTransitivelyFreezeFunctionExpressions
function Component(props) {
  const {data, loadNext, isLoadingNext} =
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

  const items = data.map(x => x);

  return items;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableTransitivelyFreezeFunctionExpressions
function Component(props) {
  const $ = _c(11);
  const { data, loadNext, isLoadingNext } =
    usePaginationFragment(props.key).items ?? [];
  let t0;
  if ($[0] !== data.length || $[1] !== loadNext) {
    t0 = () => {
      if (data.length === 0) {
        return;
      }

      loadNext();
    };
    $[0] = data.length;
    $[1] = loadNext;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  const loadMoreWithTiming = t0;
  let t1;
  if ($[3] !== isLoadingNext || $[4] !== loadMoreWithTiming) {
    t1 = () => {
      if (isLoadingNext) {
        return;
      }

      loadMoreWithTiming();
    };
    $[3] = isLoadingNext;
    $[4] = loadMoreWithTiming;
    $[5] = t1;
  } else {
    t1 = $[5];
  }
  let t2;
  if ($[6] !== isLoadingNext || $[7] !== loadMoreWithTiming) {
    t2 = [isLoadingNext, loadMoreWithTiming];
    $[6] = isLoadingNext;
    $[7] = loadMoreWithTiming;
    $[8] = t2;
  } else {
    t2 = $[8];
  }
  useEffect(t1, t2);
  let t3;
  if ($[9] !== data) {
    t3 = data.map(_temp);
    $[9] = data;
    $[10] = t3;
  } else {
    t3 = $[10];
  }
  const items = t3;
  return items;
}
function _temp(x) {
  return x;
}

```
      
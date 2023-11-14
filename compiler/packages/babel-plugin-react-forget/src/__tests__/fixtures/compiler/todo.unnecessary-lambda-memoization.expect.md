
## Input

```javascript
function Component(props) {
  const data = useFreeze(); // assume this returns {items: Array<{...}>}
  // In this call `data` and `data.items` have a read effect *and* the lambda itself
  // is readonly (it doesn't capture ony mutable references). Further, we ca
  // theoretically determine that the lambda doesn't need to be memoized, since
  // data.items is an Array and Array.prototype.map does not capture its input (callback)
  // in the return value.
  // An observation is that even without knowing the exact type of `data`, if we know
  // that it is a plain, readonly javascript object, then we can infer that any `.map()`
  // calls *must* be Array.prototype.map (or else they are a runtime error), since no
  // other builtin has a .map() function.
  const items = data.items.map((item) => <Item item={item} />);
  return <div>{items}</div>;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(5);
  const data = useFreeze();
  let t1;
  if ($[0] !== data.items) {
    let t0;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = (item) => <Item item={item} />;
      $[2] = t0;
    } else {
      t0 = $[2];
    }
    t1 = data.items.map(t0);
    $[0] = data.items;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const items = t1;
  let t2;
  if ($[3] !== items) {
    t2 = <div>{items}</div>;
    $[3] = items;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  return t2;
}

```
      

## Input

```javascript
function Component(props) {
  const maybeMutable = new MaybeMutable();
  let Tag = View;
  // NOTE: the order of evaluation in the lowering is incorrect:
  // the jsx element's tag observes `Tag` after reassignment, but should observe
  // it before the reassignment.
  return <Tag>{((Tag = HScroll), maybeMutae(maybeMutable))}</Tag>;
}

```

## Code

```javascript
import * as React from "react";
function Component(props) {
  const $ = React.unstable_useMemoCache(3);
  let Tag;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const maybeMutable = new MaybeMutable();

    Tag = HScroll;
    t0 = maybeMutae(maybeMutable);
    $[0] = Tag;
    $[1] = t0;
  } else {
    Tag = $[0];
    t0 = $[1];
  }
  let t1;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = <Tag>{t0}</Tag>;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

```
      
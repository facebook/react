
## Input

```javascript
function Component(props) {
  const maybeMutable = new MaybeMutable();
  let Tag = View;
  // NOTE: the order of evaluation in the lowering is incorrect:
  // the jsx element's tag observes `Tag` after reassignment, but should observe
  // it before the reassignment.
  return (
    <Tag>
      {((Tag = HScroll), maybeMutate(maybeMutable))}
      <Tag />
    </Tag>
  );
}

```

## Code

```javascript
import * as React from "react";
function Component(props) {
  const $ = React.unstable_useMemoCache(5);
  let Tag;
  let t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const maybeMutable = new MaybeMutable();

    t0 = "\n      ";
    Tag = HScroll;
    t1 = maybeMutate(maybeMutable);
    $[0] = Tag;
    $[1] = t0;
    $[2] = t1;
  } else {
    Tag = $[0];
    t0 = $[1];
    t1 = $[2];
  }
  let t2;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = <Tag />;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  let t3;
  if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = (
      <Tag>
        {t0}
        {t1}
        {t2}
      </Tag>
    );
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  return t3;
}

```
      
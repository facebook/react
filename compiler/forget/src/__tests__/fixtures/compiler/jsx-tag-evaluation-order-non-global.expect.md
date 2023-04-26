
## Input

```javascript
function Component(props) {
  const maybeMutable = new MaybeMutable();
  let Tag = props.component;
  // NOTE: the order of evaluation in the lowering is incorrect:
  // the jsx element's tag observes `Tag` after reassignment, but should observe
  // it before the reassignment.
  return (
    <Tag>
      {((Tag = props.alternateComponent), maybeMutate(maybeMutable))}
      <Tag />
    </Tag>
  );
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(13);
  const c_0 = $[0] !== props.component;
  const c_1 = $[1] !== props.alternateComponent;
  let Tag;
  let T0;
  let t1;
  let t2;
  if (c_0 || c_1) {
    const maybeMutable = new MaybeMutable();
    Tag = props.component;

    T0 = Tag;
    t1 = "\n      ";
    Tag = props.alternateComponent;
    t2 = maybeMutate(maybeMutable);
    $[0] = props.component;
    $[1] = props.alternateComponent;
    $[2] = Tag;
    $[3] = T0;
    $[4] = t1;
    $[5] = t2;
  } else {
    Tag = $[2];
    T0 = $[3];
    t1 = $[4];
    t2 = $[5];
  }
  const c_6 = $[6] !== Tag;
  let t3;
  if (c_6) {
    t3 = <Tag />;
    $[6] = Tag;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  const c_8 = $[8] !== T0;
  const c_9 = $[9] !== t1;
  const c_10 = $[10] !== t2;
  const c_11 = $[11] !== t3;
  let t4;
  if (c_8 || c_9 || c_10 || c_11) {
    t4 = (
      <T0>
        {t1}
        {t2}
        {t3}
      </T0>
    );
    $[8] = T0;
    $[9] = t1;
    $[10] = t2;
    $[11] = t3;
    $[12] = t4;
  } else {
    t4 = $[12];
  }
  return t4;
}

```
      
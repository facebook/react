
## Input

```javascript
import { StaticText1, StaticText2 } from "shared-runtime";

function MaybeMutable() {
  return {};
}
function maybeMutate(x) {}

function Component(props) {
  const maybeMutable = new MaybeMutable();
  let Tag = props.component;
  // NOTE: the order of evaluation in the lowering is incorrect:
  // the jsx element's tag observes `Tag` after reassignment, but should observe
  // it before the reassignment.

  // Currently, Forget preserves jsx whitespace in the source text.
  // prettier-ignore
  return (
    <Tag>{((Tag = props.alternateComponent), maybeMutate(maybeMutable))}<Tag /></Tag>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ component: StaticText1, alternateComponent: StaticText2 }],
  isComponent: true,
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import { StaticText1, StaticText2 } from "shared-runtime";

function MaybeMutable() {
  const $ = useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = {};
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

function maybeMutate(x) {}

function Component(props) {
  const $ = useMemoCache(11);
  const c_0 = $[0] !== props.component;
  const c_1 = $[1] !== props.alternateComponent;
  let Tag;
  let T0;
  let t1;
  if (c_0 || c_1) {
    const maybeMutable = new MaybeMutable();
    Tag = props.component;

    T0 = Tag;
    t1 = ((Tag = props.alternateComponent), maybeMutate(maybeMutable));
    $[0] = props.component;
    $[1] = props.alternateComponent;
    $[2] = Tag;
    $[3] = T0;
    $[4] = t1;
  } else {
    Tag = $[2];
    T0 = $[3];
    t1 = $[4];
  }
  const c_5 = $[5] !== Tag;
  let t2;
  if (c_5) {
    t2 = <Tag />;
    $[5] = Tag;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  const c_7 = $[7] !== T0;
  const c_8 = $[8] !== t1;
  const c_9 = $[9] !== t2;
  let t3;
  if (c_7 || c_8 || c_9) {
    t3 = (
      <T0>
        {t1}
        {t2}
      </T0>
    );
    $[7] = T0;
    $[8] = t1;
    $[9] = t2;
    $[10] = t3;
  } else {
    t3 = $[10];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ component: StaticText1, alternateComponent: StaticText2 }],
  isComponent: true,
};

```
      
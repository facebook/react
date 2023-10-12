
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
  let Tag;
  let T0;
  let t1;
  if ($[0] !== props.component || $[1] !== props.alternateComponent) {
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
  let t2;
  if ($[5] !== Tag) {
    t2 = <Tag />;
    $[5] = Tag;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  let t3;
  if ($[7] !== T0 || $[8] !== t1 || $[9] !== t2) {
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
      
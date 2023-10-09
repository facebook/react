
## Input

```javascript
// @enableMergeConsecutiveScopes
function Component(id) {
  const bar = (() => {})();

  return (
    <>
      <Bar title={bar} />
      <Bar title={id ? true : false} />
    </>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [null],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @enableMergeConsecutiveScopes
function Component(id) {
  const $ = useMemoCache(3);
  let t22;
  t22 = undefined;
  const bar = t22;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <Bar title={bar} />;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const t1 = id ? true : false;
  const c_1 = $[1] !== t1;
  let t2;
  if (c_1) {
    t2 = (
      <>
        {t0}
        <Bar title={t1} />
      </>
    );
    $[1] = t1;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [null],
};

```
      

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
  const $ = useMemoCache(4);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = (() => {})();
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const bar = t0;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = <Bar title={bar} />;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const t2 = id ? true : false;
  const c_2 = $[2] !== t2;
  let t3;
  if (c_2) {
    t3 = (
      <>
        {t1}
        <Bar title={t2} />
      </>
    );
    $[2] = t2;
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [null],
};

```
      
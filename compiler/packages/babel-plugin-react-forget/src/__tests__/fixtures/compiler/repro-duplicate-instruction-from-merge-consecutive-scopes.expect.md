
## Input

```javascript
// @enableMergeConsecutiveScopes
import { Stringify } from "shared-runtime";

function Component({ id }) {
  const bar = (() => {})();

  return (
    <>
      <Stringify title={bar} />
      <Stringify title={id ? true : false} />
    </>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @enableMergeConsecutiveScopes
import { Stringify } from "shared-runtime";

function Component(t23) {
  const $ = useMemoCache(3);
  const { id } = t23;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <Stringify title={undefined} />;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const t1 = id ? true : false;
  let t2;
  if ($[1] !== t1) {
    t2 = (
      <>
        {t0}
        <Stringify title={t1} />
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
  params: [{}],
};

```
      
### Eval output
(kind: ok) <div>{}</div><div>{"title":false}</div>
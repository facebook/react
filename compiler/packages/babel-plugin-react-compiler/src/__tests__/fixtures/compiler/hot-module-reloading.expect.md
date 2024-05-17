
## Input

```javascript
// @enableResetCacheOnSourceFileChanges
import { useMemo, useState } from "react";
import { ValidateMemoization } from "shared-runtime";

function Component(props) {
  const [state, setState] = useState(0);
  const doubled = useMemo(() => [state * 2], [state]);
  return <ValidateMemoization inputs={[state]} output={doubled} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
  sequentialRenders: [{}, {}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableResetCacheOnSourceFileChanges
import { useMemo, useState } from "react";
import { ValidateMemoization } from "shared-runtime";

function Component(props) {
  const $ = _c(5);
  if (
    $[0] !== "bb6936608c0afe8e313aa547ca09fbc8451f24664284368812127c7e9bc2bca9"
  ) {
    for (let $i = 0; $i < 5; $i += 1) {
      $[$i] = Symbol.for("react.memo_cache_sentinel");
    }
    $[0] = "bb6936608c0afe8e313aa547ca09fbc8451f24664284368812127c7e9bc2bca9";
  }
  const [state] = useState(0);
  let t0;
  const t1 = state * 2;
  let t2;
  if ($[1] !== t1) {
    t2 = [t1];
    $[1] = t1;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  t0 = t2;
  const doubled = t0;
  let t3;
  if ($[3] !== state) {
    t3 = <ValidateMemoization inputs={[state]} output={doubled} />;
    $[3] = state;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
  sequentialRenders: [{}, {}],
};

```
      
### Eval output
(kind: ok) <div>{"inputs":[0],"output":[0]}</div>
<div>{"inputs":[0],"output":[0]}</div>

## Input

```javascript
import {ValidateMemoization} from 'shared-runtime';

function Component() {
  const x = {};
  const y = {
    x,
    valueOf() {
      return x;
    },
  };
  y.valueOf().z = true;

  return <ValidateMemoization inputs={[x]} output={x} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
  sequentialRenders: [{}, {}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { ValidateMemoization } from "shared-runtime";

function Component() {
  const $ = _c(2);
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = {};
    const y = {
      x,
      valueOf() {
        return x;
      },
    };

    y.valueOf().z = true;
    $[0] = x;
  } else {
    x = $[0];
  }
  let t0;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <ValidateMemoization inputs={[x]} output={x} />;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
  sequentialRenders: [{}, {}],
};

```
      
### Eval output
(kind: ok) <div>{"inputs":[{"z":true}],"output":"[[ cyclic ref *2 ]]"}</div>
<div>{"inputs":[{"z":true}],"output":"[[ cyclic ref *2 ]]"}</div>
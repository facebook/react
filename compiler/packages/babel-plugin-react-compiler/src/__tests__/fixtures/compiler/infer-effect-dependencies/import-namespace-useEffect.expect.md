
## Input

```javascript
// @inferEffectDependencies
import * as React from 'react';
import * as SharedRuntime from 'shared-runtime';

function NonReactiveDepInEffect() {
  const obj = makeObject_Primitives();
  React.useEffect(() => print(obj));
  SharedRuntime.useSpecialEffect(() => print(obj), [obj]);
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @inferEffectDependencies
import * as React from "react";
import * as SharedRuntime from "shared-runtime";

function NonReactiveDepInEffect() {
  const $ = _c(4);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = makeObject_Primitives();
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const obj = t0;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = () => print(obj);
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  React.useEffect(t1, [obj]);
  let t2;
  let t3;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = () => print(obj);
    t3 = [obj];
    $[2] = t2;
    $[3] = t3;
  } else {
    t2 = $[2];
    t3 = $[3];
  }
  SharedRuntime.useSpecialEffect(t2, t3, [obj]);
}

```
      
### Eval output
(kind: exception) Fixture not implemented
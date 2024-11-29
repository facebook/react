
## Input

```javascript
// @inferEffectDependencies
import * as React from 'react';

/**
 * TODO: recognize import namespace
 */
function NonReactiveDepInEffect() {
  const obj = makeObject_Primitives();
  React.useEffect(() => print(obj));
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @inferEffectDependencies
import * as React from "react";

/**
 * TODO: recognize import namespace
 */
function NonReactiveDepInEffect() {
  const $ = _c(2);
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
  React.useEffect(t1);
}

```
      
### Eval output
(kind: exception) Fixture not implemented
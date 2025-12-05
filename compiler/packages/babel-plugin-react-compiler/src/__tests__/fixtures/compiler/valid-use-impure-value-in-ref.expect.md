
## Input

```javascript
// @validateNoImpureFunctionsInRender
import {useIdentity} from 'shared-runtime';

function Component() {
  const f = () => Math.random();
  const ref = useRef(f());
  return <div ref={ref} nonRef={nonRef} state={state} setState={setState} />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoImpureFunctionsInRender
import { useIdentity } from "shared-runtime";

function Component() {
  const $ = _c(3);
  let t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const f = _temp;
    t0 = useRef;
    t1 = f();
    $[0] = t0;
    $[1] = t1;
  } else {
    t0 = $[0];
    t1 = $[1];
  }
  const ref = t0(t1);
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = <div ref={ref} nonRef={nonRef} state={state} setState={setState} />;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  return t2;
}
function _temp() {
  return Math.random();
}

```
      
### Eval output
(kind: exception) Fixture not implemented

## Input

```javascript
// @validateNoImpureFunctionsInRender
import {useIdentity} from 'shared-runtime';

function Component() {
  const f = () => Math.random();
  const ref = useRef(f());
  return <div ref={ref} />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoImpureFunctionsInRender
import { useIdentity } from "shared-runtime";

function Component() {
  const $ = _c(2);
  const f = _temp;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = f();
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const ref = useRef(t0);
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = <div ref={ref} />;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}
function _temp() {
  return Math.random();
}

```
      
### Eval output
(kind: exception) Fixture not implemented
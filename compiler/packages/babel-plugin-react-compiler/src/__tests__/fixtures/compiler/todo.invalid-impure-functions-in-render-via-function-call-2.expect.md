
## Input

```javascript
// @validateNoImpureFunctionsInRender

import {identity, makeArray} from 'shared-runtime';

function Component() {
  const now = () => Date.now();
  const f = () => {
    // this should error but we currently lose track of the impurity bc
    // the impure value comes from behind a call
    const array = makeArray(now());
    const hasDate = identity(array);
    return hasDate;
  };
  const hasDate = f();
  return <Foo hasDate={hasDate} />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoImpureFunctionsInRender

import { identity, makeArray } from "shared-runtime";

function Component() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const now = _temp;
    const f = () => {
      const array = makeArray(now());
      const hasDate = identity(array);
      return hasDate;
    };

    const hasDate_0 = f();
    t0 = <Foo hasDate={hasDate_0} />;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}
function _temp() {
  return Date.now();
}

```
      
### Eval output
(kind: exception) Fixture not implemented

## Input

```javascript
// @validateNoImpureFunctionsInRender

import {identity, makeArray} from 'shared-runtime';

/**
 * Allowed: we don't have sufficient type information to be sure that
 * this accesses an impure value during render. The impurity is lost
 * when passed through external function calls.
 */
function Component() {
  const getDate = () => Date.now();
  const array = makeArray(getDate());
  const hasDate = identity(array);
  return <Foo hasDate={hasDate} />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoImpureFunctionsInRender

import { identity, makeArray } from "shared-runtime";

/**
 * Allowed: we don't have sufficient type information to be sure that
 * this accesses an impure value during render. The impurity is lost
 * when passed through external function calls.
 */
function Component() {
  const $ = _c(1);
  const getDate = _temp;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const array = makeArray(getDate());
    const hasDate = identity(array);
    t0 = <Foo hasDate={hasDate} />;
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
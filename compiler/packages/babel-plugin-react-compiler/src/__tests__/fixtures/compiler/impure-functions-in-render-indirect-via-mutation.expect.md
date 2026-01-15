
## Input

```javascript
// @validateNoImpureFunctionsInRender

import {arrayPush, identity, makeArray} from 'shared-runtime';

/**
 * Allowed: we don't have sufficient type information to be sure that
 * this accesses an impure value during render. The impurity is lost
 * when passed through external function calls.
 */
function Component() {
  const getDate = () => Date.now();
  const now = getDate();
  const array = [];
  arrayPush(array, now);
  return <Foo hasDate={array} />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoImpureFunctionsInRender

import { arrayPush, identity, makeArray } from "shared-runtime";

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
    const now = getDate();
    const array = [];
    arrayPush(array, now);
    t0 = <Foo hasDate={array} />;
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

## Input

```javascript
// @validateNoImpureFunctionsInRender

import {identity, makeArray} from 'shared-runtime';

function Component() {
  const now = Date.now();
  const renderItem = () => {
    const array = makeArray(now);
    // we don't have an alias signature for identity(), so we optimistically
    // assume this doesn't propagate the impurity
    const hasDate = identity(array);
    return <Bar hasDate={hasDate} />;
  };
  return <Foo renderItem={renderItem} />;
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
    const now = Date.now();
    const renderItem = () => {
      const array = makeArray(now);
      const hasDate = identity(array);
      return <Bar hasDate={hasDate} />;
    };
    t0 = <Foo renderItem={renderItem} />;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

```
      
### Eval output
(kind: exception) Fixture not implemented